# Pieces Copilot SDK

This repository contains the Pieces Copilot SDK, a convenient wrapper around the Pieces OS Client SDK. It simplifies the process of interacting with your applications by providing a more user-friendly interface to the underlying Pieces OS Client SDK.

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

## Usage

First, you need to import the SDK and initialize it with your base URL. The base URL will depend on your setup:

- If you are using a local instance of Pieces OS:
  - On MacOS/Windows, use `http://localhost:1000`
  - On Linux, use `http://localhost:5323`
- If you are using a remote instance of Pieces OS, use the URL you have set up for that.

Here's how you can initialize the SDK:

```typescript
import { PiecesCopilotSDK } from 'pieces-copilot-sdk';

// Replace 'your_base_url' with your actual base URL
const sdk = new PiecesCopilotSDK({ baseUrl: 'your_base_url' });
```

Then, you can use the various methods provided by the SDK to interact with your applications.

## Features

- **Simplified Interaction**: The Pieces Copilot SDK simplifies the interaction with the Pieces OS Client SDK by providing easy-to-use methods for various operations.
- **Fetch Saved Materials**: Retrieve a list of saved materials using the `getSavedMaterials()` method.
- **Search Assets**: Search for assets using the `searchSavedMaterials()` method.
- **Get User Profile Picture**: Retrieve the user's profile picture using the `getUserProfilePicture()` method.
- **Manage Conversations**: The SDK provides various methods to manage conversations such as fetching a specific conversation, updating conversation name, and more.

All methods are designed to handle errors gracefully and return appropriate fallback values. For instance, if there's an error while fetching saved materials, the `getSavedMaterials()` method will return an empty array.

## Methods

### `createConversation({ name?, firstMessage? })`

This method creates a new conversation. It takes an optional name and optional first message as parameters. It returns a Promise that resolves to an object containing the new conversation and the answer to the first message (if provided).

Example usage:

```typescript
import { createConversation } from 'pieces-copilot-sdk';

const newConversation = await createConversation({
  name: 'Hello World Conversation',
  firstMessage: 'Hello, world!',
});
```

### `getConversation({ conversationId, includeRawMessages? })`

This method retrieves a conversation by its ID. You can choose to include raw messages in the conversation by setting the `includeRawMessages` parameter to `true`. It returns a Promise that resolves to a Conversation object or undefined.

Example usage:

```typescript
import { getSpecificConversation } from 'pieces-copilot-sdk';

const conversation = await getSpecificConversation({
  conversationId: 'conversationId',
  includeRawMessages: true,
});
```

### `getConversations()`

This method retrieves all conversations. It returns a Promise that resolves to an array of Conversation objects or undefined.

Example usage:

```typescript
const conversations = await getConversations();
```

### `promptConversation({ message, conversationId, regenerateConversationName? })`

This method prompts a conversation with a message. It takes an object with the message, conversation ID, and an optional flag to regenerate the conversation name, which is false by default, as parameters. It returns a Promise that resolves to a string (the answer to the message) or undefined.

If there are previous messages in the conversation, they will be used as context for the new message.

Example usage:

```typescript
import { promptConversation } from 'pieces-copilot-sdk';

const answer = await promptConversation({
  message: 'Hello, world!',
  conversationId: 'conversationId'
});
```

### `updateConversationName({ conversationId })`

This method generates a new name for a specific conversation based on the messages that have sent. It takes an object with the conversation ID as a parameter. It returns a Promise that resolves to a string (the updated conversation name) or undefined.

Example usage:

```typescript
import { updateConversationName } from 'pieces-copilot-sdk';

const updatedName = await updateConversationName('conversationId');
```

### `getSavedMaterials()`

This method retrieves all saved materials. It returns a Promise that resolves to an array of Asset objects or an empty array.

Example usage:

```typescript
import { getSavedMaterials } from 'pieces-copilot-sdk';

const savedMaterials = await getSavedMaterials();
```

### `searchSavedMaterials({ query })`

This method searches for saved materials based on a query. It takes an object with the query as a parameter. It returns a Promise that resolves to an array of Asset objects or an empty array.

Example usage:

```typescript
import { searchSavedMaterials } from 'pieces-copilot-sdk';

const searchResults = await searchSavedMaterials({ query: 'query' });
```

Replace `'query'` with the actual search query.

### `getUserProfilePicture()`

This method retrieves the user's profile picture. It returns a Promise that resolves to a string (the URL of the profile picture) or undefined.

Example usage:

```typescript
import { getUserProfilePicture } from 'pieces-copilot-sdk';

const profilePictureUrl = await getUserProfilePicture();
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before starting.

## License

This project is licensed under the terms of the MIT license.
