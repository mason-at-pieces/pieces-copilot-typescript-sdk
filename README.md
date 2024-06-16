# Pieces Copilot SDK

> 

This repository contains the Pieces Copilot SDK, a convenient wrapper around the Pieces OS Client SDK. It simplifies the process of interacting with your applications by providing a more user-friendly interface to the underlying Pieces OS Client SDK.

[View on NPM](https://www.npmjs.com/package/pieces-copilot-sdk)

## Installation

To use the Pieces Copilot SDK in your project, you need to install it via npm:

```bash
npm install pieces-copilot-sdk
```

For pnpm:
```bash
pnpm install pieces-copilot-sdk
```

For yarn:
```bash
yarn add pieces-copilot-sdk
```

## Requirements

> **You must either have [Pieces OS](https://docs.pieces.app/installation-getting-started/what-am-i-installing) installed on your local machine or have access to a remote instance of Pieces OS to use this SDK.**

## Usage

First, you need to import the SDK and initialize it with your base URL. The base URL will depend on your setup:

- If you are using a local instance of Pieces OS:
  - On macOS/Windows, use `http://localhost:1000`
  - On Linux, use `http://localhost:5323`
- If you are using a remote instance of Pieces OS, use the URL you have set up for that.

Here's how you can initialize the SDK:

```typescript
import { PiecesClient } from 'pieces-copilot-sdk';

// Replace 'your_base_url' with your actual base URL
const piecesClient = new PiecesClient({ baseUrl: 'your_base_url' });
```

Then, you can use the various methods provided by the SDK to interact with your applications.

## Features

- **Simplified Interaction**: The Pieces Copilot SDK simplifies the interaction with the Pieces OS Client SDK by providing easy-to-use methods for various operations.
- **Manage Conversations**: The SDK provides various methods to manage conversations such as fetching a specific conversation, updating conversation name, and more.
- **Get User Profile Picture**: Retrieve the user's profile picture using the `getUserProfilePicture()` method.

## Methods

### `createConversation({ name?, firstMessage? })`

This method creates a new conversation. It takes an optional name and optional first message as parameters. It returns a Promise that resolves to an object containing the new conversation and the answer to the first message (if provided).

Example usage:

```typescript
const newConversation = await piecesClient.createConversation({
  name: 'Hello World Conversation',
  firstMessage: 'Hello, world!',
});
```

### `getConversation({ conversationId, includeRawMessages? })`

This method retrieves a conversation by its ID. You can choose to include raw messages in the conversation by setting the `includeRawMessages` parameter to `true`. It returns a Promise that resolves to a Conversation object or undefined.

Example usage:
 
```typescript
const conversation = await piecesClient.getSpecificConversation({
  conversationId: 'conversationId',
  includeRawMessages: true,
});
```

### `getConversations()`

This method retrieves all conversations. It returns a Promise that resolves to an array of Conversation objects or undefined.

Example usage:

```typescript
const conversations = await piecesClient.getConversations();
```

### `promptConversation({ message, conversationId, regenerateConversationName? })`

This method prompts a conversation with a message. It takes an object with the message, conversation ID, and an optional flag to regenerate the conversation name, which is false by default, as parameters. It returns a Promise that resolves to an object containing the text of the answer, the ID of the user query message, and the ID of the bot response message.

If there are previous messages in the conversation, they will be used as context for the new message.

If there is an error, it will return a Promise that resolves to an object containing only the text of the error message.

Example usage:

```typescript
const answer = await piecesClient.promptConversation({
  message: 'Hello, world!',
  conversationId: 'conversationId'
});
```

### `updateConversationName({ conversationId })`

This method generates a new name for a specific conversation based on the messages that have sent. It takes an object with the conversation ID as a parameter. It returns a Promise that resolves to a string (the updated conversation name) or undefined.

Example usage:

```typescript
const updatedName = await piecesClient.updateConversationName('conversationId');
```

### `getUserProfilePicture()`

This method retrieves the user's profile picture. It returns a Promise that resolves to a string (the URL of the profile picture) or undefined.

Example usage:

```typescript
const profilePictureUrl = await piecesClient.getUserProfilePicture();
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before starting.

## License

This project is licensed under the terms of the MIT license.
