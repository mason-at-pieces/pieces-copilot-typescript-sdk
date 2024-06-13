import {
  Application,
  ApplicationNameEnum,
  Asset,
  AssetsApi,
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

const serverBaseUrl = ''

if (!serverBaseUrl) {
  throw new Error(
    'Missing server base url. You must set PIECES_OS_SERVER as an environment variable and only use this file on the server.'
  );
}

export const piecesConfig = new Configuration({
  basePath: serverBaseUrl,
});
console.log('Pieces Client Loaded');

const trackedApplication: Application = {
  id: 'DEFAULT', // This is the application id for all open source applications
  name: ApplicationNameEnum.OpenSource,
  version: '0.0.1',
  platform: PlatformEnum.Macos,
  onboarded: false,
  privacy: PrivacyEnum.Anonymous,
};

export const assetsApi = new AssetsApi(piecesConfig);
export const conversationMessagesApi = new ConversationMessagesApi(
  piecesConfig
);
export const conversationsApi = new ConversationsApi(piecesConfig);
export const conversationApi = new ConversationApi(piecesConfig);
export const qgptApi = new QGPTApi(piecesConfig);
export const userApi = new UserApi(piecesConfig);

// export const connectToPieces = async () => {
//   try {
//     const connection = await connectorApi.connect({
//       seededConnectorConnection: {
//         application: trackedApplication,
//       },
//     });
//
//     return connection;
//   } catch (error) {
//     console.error('Error connecting to Pieces', error);
//   }
// };

export const createConversation = async (
  props: {
    name?: string;
    firstMessage?: string;
  } = {}
): Promise<{
  conversation: Conversation;
  answer?: string;
} | null> => {
  const { name, firstMessage } = props;

  try {
    // const systemMessage =
    //   await conversationMessagesApi.messagesCreateSpecificMessage({
    //     seededConversationMessage: {
    //       role: QGPTConversationMessageRoleEnum.System,
    //       fragment: {
    //         string: {
    //           raw: 'You are an expert support worker who prides themselves on helping users resolve any problems they are having with Pieces in general, Pieces integrations on general support on issues related to Pieces. You will always answer in an accurate,  polite and helpful manner. Remember that being a good support is essential for the success ofo the company. You will get a users query and some information from our support pages, documentation and faq. Use the information to provide support for the user. If there is no information related to their query, politely direct them to reach out via the support form here https://getpieces.typeform.com/to/mCjBSIjF',
    //         },
    //       },
    //     },
    //   });

    // const seededSystemMessage: SeededConversationMessage = {
    //   role: QGPTConversationMessageRoleEnum.System,
    //   fragment: {
    //     string: {
    //       raw: 'You are an expert support worker who prides themselves on helping users resolve any problems they are having with Pieces in general, Pieces integrations on general support on issues related to Pieces. You will always answer in an accurate,  polite and helpful manner. Remember that being a good support is essential for the success ofo the company. You will get a users query and some information from our support pages, documentation and faq. Use the information to provide support for the user. If there is no information related to their query, politely direct them to reach out via the support form here https://getpieces.typeform.com/to/mCjBSIjF',
    //     },
    //   },
    // };

    const newConversation =
      await conversationsApi.conversationsCreateSpecificConversation({
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
      const answer = await promptConversation({
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
};

export const getConversations = async (): Promise<
  Conversation[] | undefined
> => {
  try {
    const conversations = await conversationsApi.conversationsSnapshot();

    return conversations.iterable || [];
  } catch (error) {
    console.error('Error fetching conversations', error);

    return undefined;
  }
};

export const getConversation = async ({
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
> => {
  const conversationMessages: {
    message: string;
    isUserMessage: boolean;
  }[] = [];

  try {
    const conversation =
      await conversationApi.conversationGetSpecificConversation({
        conversation: conversationId,
      });

    if (!includeRawMessages) {
      return conversation;
    }

    const conversationMessageApi = new ConversationMessageApi(piecesConfig);
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
};

export const promptConversation = async ({
                                           message,
                                           conversationId,
                                         }: {
  message: string;
  conversationId: string;
}): Promise<string> => {
  try {
    // Add the user message to the conversation
    const userMessage =
      await conversationMessagesApi.messagesCreateSpecificMessage({
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

    const conversation = await getConversation({
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
                ...trackedApplication,
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

    // const base64Data = await ingestDirectory({
    //   directory: '/Users/pieces/IdeaProjects/documentation/docs',
    //   excludedPaths: [
    //     'reference/typescript/apis',
    //     'reference/typescript/models',
    //     'reference/dart/apis',
    //     'reference/dart/models',
    //     'reference/kotlin/apis',
    //     'reference/kotlin/models',
    //     'reference/python/apis',
    //     'reference/python/models',
    //   ],
    // });
    //
    // const docsSiteRelevantSeeds: RelevantQGPTSeed[] = base64Data.map(
    //   (file) => ({
    //     seed: {
    //       type: SeedTypeEnum.Asset,
    //       asset: {
    //         application: {
    //           ...trackedApplication,
    //         },
    //         format: {
    //           fragment: {
    //             string: {
    //               raw: file.rawContent,
    //             },
    //             metadata: {
    //               ext: 'md',
    //             },
    //           },
    //         },
    //       },
    //     },
    //   })
    // );
    //
    // const getParsedCsvData = await parseCsv(
    //   '/Users/pieces/Downloads/hubspot-data.csv'
    // );
    //
    // const csvRelevantSeeds: RelevantQGPTSeed[] = getParsedCsvData.map(
    //   (row) => ({
    //     seed: {
    //       type: SeedTypeEnum.Asset,
    //       asset: {
    //         application: {
    //           ...trackedApplication,
    //         },
    //         format: {
    //           fragment: {
    //             string: {
    //               raw: JSON.stringify(row),
    //             },
    //           },
    //         },
    //       },
    //     },
    //   })
    // );
    //
    // const getParsedGithubIssuesData = await parseCsv(
    //   '/Users/pieces/IdeaProjects/pieces-support-copilot/issues.csv'
    // );
    //
    // const githubIssuesRelevantSeeds: RelevantQGPTSeed[] =
    //   getParsedGithubIssuesData.map((row) => ({
    //     seed: {
    //       type: SeedTypeEnum.Asset,
    //       asset: {
    //         application: {
    //           ...trackedApplication,
    //         },
    //         metadata: {
    //           name: Object.values(row)[2],
    //         },
    //         format: {
    //           fragment: {
    //             string: {
    //               raw: JSON.stringify(row),
    //             },
    //           },
    //         },
    //       },
    //     },
    //   }));

    // Ask the user question to the llm to get a generated response
    const answer = await qgptApi.question({
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
      await conversationMessagesApi.messagesCreateSpecificMessage({
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

    const updateName = await updateConversationName(conversationId);

    return answer.answers.iterable[0].text;
  } catch (error) {
    console.error('Error prompting conversation', error);

    return 'Error asking question';
  }
};

export const updateConversationName = async (
  conversationId: string
): Promise<string | undefined> => {
  try {
    const conversation =
      await conversationApi.conversationSpecificConversationRename({
        conversation: conversationId,
      });

    return conversation.name;
  } catch (error) {
    console.error('Error updating conversation name', error);

    return 'Error updating conversation name';
  }
};

export const getUserProfilePicture = async (): Promise<string | undefined> => {
  try {
    const userRes = await userApi.userSnapshot();

    return userRes.user?.picture
  } catch (error) {
    console.error('Error getting user profile picture', error);

    return undefined;
  }
};

export const getSavedMaterials = async (): Promise<Asset[] | []> => {
  try {
    const assets = await assetsApi.assetsSnapshot();

    return assets.iterable;
  } catch (error) {
    console.error('Error fetching saved materials', error);

    return [];
  }
};

export const searchSavedMaterials = async ({
  query,
}: {
  query: string;
}): Promise<Asset[] | []> => {
  try {
    const searchedAssets = await assetsApi.assetsSearchAssets({
      query,
    });

    // Filter out any assets that are undefined
    const cleanedAssets = searchedAssets.iterable
      .filter((searchedAsset) => !!searchedAsset.asset)
      .map((searchedAsset) => searchedAsset.asset!);

    return cleanedAssets;
  } catch (error) {
    console.error('Error searching saved materials', error);

    return [];
  }
};
