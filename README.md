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

## Contributing

Contributions are welcome! Please read our contributing guidelines before starting.

## License

This project is licensed under the terms of the MIT license.
