import {
  Application,
  ApplicationNameEnum,
  Configuration,
  Conversation,
  ConversationApi,
  ConversationMessageApi,
  ConversationMessagesApi,
  ConversationsApi,
  ConversationTypeEnum,
  PlatformEnum,
  PrivacyEnum,
  QGPTApi,
  QGPTConversationMessageRoleEnum,
  RelevantQGPTSeed,
  SeedTypeEnum,
  UserApi,
} from '@pieces.app/pieces-os-client';

export class PiecesClient {
  config: Configuration;
  trackedApplication: Application
  conversationMessagesApi: ConversationMessagesApi;
  conversationsApi: ConversationsApi;
  conversationApi: ConversationApi;
  qgptApi: QGPTApi;
  userApi: UserApi;

  constructor(config: { baseUrl: string }, trackedApplication?: Application) {
    this.config = new Configuration({
      basePath: config.baseUrl,
    });

    this.conversationMessagesApi = new ConversationMessagesApi(this.config);
    this.conversationsApi = new ConversationsApi(this.config);
    this.conversationApi = new ConversationApi(this.config);
    this.qgptApi = new QGPTApi(this.config);
    this.userApi = new UserApi(this.config);

    this.trackedApplication = trackedApplication || {
      id: 'DEFAULT',
      name: ApplicationNameEnum.OpenSource,
      version: '0.0.1',
      platform: PlatformEnum.Macos,
      onboarded: false,
      privacy: PrivacyEnum.Anonymous,
    }
  }

  async createConversation(props: {
    name?: string;
    firstMessage?: string;
  } = {}): Promise<{
    conversation: Conversation;
    answer?: string;
  } | null> {
    const { name, firstMessage } = props;

    try {
      const newConversation =
        await this.conversationsApi.conversationsCreateSpecificConversation({
          seededConversation: {
            name: name || 'New Conversation',
            pipeline: {
              conversation: {
                contextualizedCodeDialog: {},
              },
            },
            type: ConversationTypeEnum.Copilot,
          },
        });

      // If there is a first message passed in, prompt the conversation with it and return the answer
      if (firstMessage) {
        const answer = await this.promptConversation({
          message: firstMessage,
          conversationId: newConversation.id,
        });

        return {
          conversation: newConversation,
          answer,
        };
      }

      return {
        conversation: newConversation,
      };
    } catch (error) {
      console.error('Error creating conversation', error);

      return null;
    }
  }

  async getConversation({
    conversationId,
    includeRawMessages = false,
  }: {
    conversationId: string;
    includeRawMessages?: boolean;
  }): Promise<
    | (Conversation & {
        rawMessages?: {
          message: string;
          isUserMessage: boolean;
        }[];
      })
    | undefined
  > {
    const conversationMessages: {
      message: string;
      isUserMessage: boolean;
    }[] = [];

    try {
      const conversation =
        await this.conversationApi.conversationGetSpecificConversation({
          conversation: conversationId,
        });

      if (!includeRawMessages) {
        return conversation;
      }

      const conversationMessageApi = new ConversationMessageApi(this.config);
      for (const [messageId, index] of Object.entries(
        conversation.messages.indices || {}
      )) {
        const messageResponse =
          await conversationMessageApi.messageSpecificMessageSnapshot({
            message: messageId,
          });

        if (
          !messageResponse.fragment ||
          !messageResponse.fragment.string ||
          !messageResponse.fragment.string.raw
        ) {
          continue;
        }

        conversationMessages.push({
          message: messageResponse.fragment.string.raw,
          isUserMessage: messageResponse.role === 'USER',
        });
      }

      return {
        ...conversation,
        rawMessages: conversationMessages,
      };
    } catch (error) {
      console.error('Error getting conversation', error);

      return undefined;
    }
  }

  async getConversations(): Promise<Conversation[] | undefined> {
    try {
      const conversations = await this.conversationsApi.conversationsSnapshot();

      return conversations.iterable || [];
    } catch (error) {
      console.error('Error fetching conversations', error);

      return undefined;
    }
  }

  async promptConversation({
    message,
    conversationId,
    regenerateConversationName = false,
  }: {
    message: string;
    conversationId: string;
    regenerateConversationName?: boolean;
  }): Promise<string> {
    try {
      // Add the user message to the conversation
      const userMessage =
        await this.conversationMessagesApi.messagesCreateSpecificMessage({
          seededConversationMessage: {
            role: QGPTConversationMessageRoleEnum.User,
            fragment: {
              string: {
                raw: message,
              },
            },
            conversation: { id: conversationId },
          },
        });

      const conversation = await this.getConversation({
        conversationId,
        includeRawMessages: true,
      });

      if (!conversation) {
        return 'Conversation not found';
      }

      const relevantConversationMessages: RelevantQGPTSeed[] =
        conversation.rawMessages
          ? conversation.rawMessages.map((message) => ({
              // id: conversationId,
              seed: {
                type: SeedTypeEnum.Asset,
                asset: {
                  application: {
                    ...this.trackedApplication,
                  },
                  format: {
                    fragment: {
                      string: {
                        raw: message.message,
                      },
                    },
                  },
                },
              },
            }))
          : [];

      // Ask the user question to the llm to get a generated response
      const answer = await this.qgptApi.question({
        qGPTQuestionInput: {
          query: message,
          pipeline: {
            conversation: {
              contextualizedCodeDialog: {},
            },
          },
          relevant: {
            iterable: [
              ...relevantConversationMessages,
              // ...docsSiteRelevantSeeds,
              // ...csvRelevantSeeds,
              // ...githubIssuesRelevantSeeds,
            ],
          },
        },
      });

      // Add the bot response to the conversation
      const botMessage =
        await this.conversationMessagesApi.messagesCreateSpecificMessage({
          seededConversationMessage: {
            role: QGPTConversationMessageRoleEnum.Assistant,
            fragment: {
              string: {
                raw: answer.answers.iterable[0].text,
              },
            },
            conversation: { id: conversationId },
          },
        });

      if (regenerateConversationName) {
        await this.updateConversationName({
          conversationId,
        });
      }

      return answer.answers.iterable[0].text;
    } catch (error) {
      console.error('Error prompting conversation', error);

      return 'Error asking question';
    }
  }

  async updateConversationName({
    conversationId
  }: {
    conversationId: string;
  }): Promise<string | undefined> {
    try {
      const conversation =
        await this.conversationApi.conversationSpecificConversationRename({
          conversation: conversationId,
        });

      return conversation.name;
    } catch (error) {
      console.error('Error updating conversation name', error);

      return 'Error updating conversation name';
    }
  }

  async getUserProfilePicture(): Promise<string | undefined> {
    try {
      const userRes = await this.userApi.userSnapshot();

      return userRes.user?.picture || undefined;
    } catch (error) {
      console.error('Error getting user profile picture', error);

      return undefined;
    }
  }
}
