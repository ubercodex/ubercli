# Plugin Publishing Guide

Complete guide for creating and publishing plugins to the Uber CLI Plugin Registry.

## 🎯 Overview

The plugin registry allows you to share custom tools you've created with the Uber CLI community. Plugins are reviewed by admins before being published.

## 📝 How to Create a Plugin

### Step 1: Create Your Tool in Uber CLI

1. **Open Uber CLI**
   ```bash
   uber
   ```

2. **Navigate to Plugins**
   - Type `/plugins` in the chat
   - Select "+ New tool"

3. **Describe Your Tool**
   - Example: "Fetch current weather from wttr.in API"
   - Example: "Get cryptocurrency prices from CoinGecko"
   - Example: "Read and parse CSV files"

4. **AI Generates the Code**
   - The AI will generate a complete plugin with:
     - Function name
     - Description
     - Parameters (if needed)
     - JavaScript code using Node.js built-ins

5. **Test Your Tool**
   - Use the "Test" option to verify it works
   - Make sure it returns useful data

### Step 2: Export Your Plugin

1. **Find Your Plugin File**
   - Location: `.ubercli/plugins.json` in your workspace
   - This file contains all your custom tools

2. **Extract the Tool Object**
   - Open `.ubercli/plugins.json`
   - Find your tool in the `tools` array
   - It will look like this:
   ```json
   {
     "id": "custom_1234567890",
     "name": "yourPluginName",
     "description": "What it does",
     "kind": "custom",
     "enabled": true,
     "params": [
       {
         "name": "paramName",
         "type": "string",
         "description": "What this param is for",
         "required": true
       }
     ],
     "code": "// Your JavaScript code here\nreturn { result: ... };"
   }
   ```

3. **Create Plugin JSON File**
   - Create a new file (e.g., `my-plugin.json`)
   - Copy ONLY these fields:
     - `name`
     - `description`
     - `params`
     - `code`
   - **Remove** these fields:
     - `id` (registry will generate a new one)
     - `kind` (not needed)
     - `enabled` (not needed)

### Step 3: Format Your Plugin File

Your plugin JSON file should look like this:

```json
{
  "name": "getWeather",
  "description": "Fetch current weather from wttr.in API",
  "params": [
    {
      "name": "location",
      "type": "string",
      "description": "City name or location",
      "required": true
    }
  ],
  "code": "const https = require('https');\n\nreturn new Promise((resolve, reject) => {\n  https.get(`https://wttr.in/${location}?format=j1`, (res) => {\n    let data = '';\n    res.on('data', chunk => data += chunk);\n    res.on('end', () => resolve(JSON.parse(data)));\n  }).on('error', reject);\n});"
}
```

## ✅ Plugin Format Requirements

### Required Fields

1. **name** (string)
   - Must be unique
   - Only letters, numbers, and hyphens
   - camelCase recommended
   - Example: `getWeather`, `parseCsv`, `fetchCryptoPrice`

2. **description** (string)
   - Clear, concise description
   - Max 500 characters
   - Explain what the tool does

3. **params** (array)
   - Can be empty `[]` if no parameters needed
   - Each parameter must have:
     - `name`: parameter name (string)
     - `type`: `"string"`, `"number"`, or `"boolean"`
     - `description`: what the parameter is for (string)
     - `required`: `true` or `false` (boolean)

4. **code** (string)
   - JavaScript function body
   - Use only Node.js built-ins (fs, path, os, crypto, https, etc.)
   - No npm packages allowed
   - Must return a value (object, string, number, etc.)

### Code Guidelines

✅ **Allowed:**
- Node.js built-in modules: `require('fs')`, `require('https')`, etc.
- Promises and async/await
- JSON parsing
- String manipulation
- File operations

❌ **Not Allowed:**
- npm packages (no `require('axios')`, etc.)
- External dependencies
- File system writes outside workspace
- Network requests to malicious sites

### Example Plugin

```json
{
  "name": "getCryptoPrice",
  "description": "Get current cryptocurrency price from CoinGecko API",
  "params": [
    {
      "name": "coinId",
      "type": "string",
      "description": "Cryptocurrency ID (e.g., bitcoin, ethereum)",
      "required": true
    }
  ],
  "code": "const https = require('https');\n\nreturn new Promise((resolve, reject) => {\n  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;\n  https.get(url, (res) => {\n    let data = '';\n    res.on('data', chunk => data += chunk);\n    res.on('end', () => {\n      const result = JSON.parse(data);\n      resolve({ price: result[coinId]?.usd || 'Not found' });\n    });\n  }).on('error', reject);\n});"
}
```

## 🚀 Publishing Your Plugin

### Step 1: Sign In

1. Go to [ubercli.com](https://ubercli.com)
2. Click "Sign in with GitHub"
3. Authorize the app

### Step 2: Upload Plugin

1. Click "Publish Plugin" in the header menu
2. Read the instructions on the page
3. Click "Click to Upload Plugin JSON"
4. Select your `.json` file
5. Review the preview
6. Add tags (optional): `weather`, `api`, `crypto`, etc.
7. Click "Submit for Review"

### Step 3: Wait for Approval

- Your plugin will be reviewed by an admin
- You'll receive a notification when it's approved
- Once approved, it will appear in the public registry

## 📦 After Publishing

### Installing Your Plugin

Other users can install your plugin by:

1. Finding it in the registry at [ubercli.com/registry](https://ubercli.com/registry)
2. Viewing the plugin details
3. Copying the code or downloading the JSON
4. Adding it to their `.ubercli/plugins.json` file

### Updating Your Plugin

To update your plugin:

1. Make changes in your local Uber CLI
2. Export the updated plugin
3. Re-upload to the registry
4. Wait for admin approval

## 🛡️ Review Process

### What Admins Check

- ✅ Code quality and safety
- ✅ No malicious code
- ✅ Proper error handling
- ✅ Clear description
- ✅ Valid parameters
- ✅ Actually works as described

### Common Rejection Reasons

- ❌ Malicious or unsafe code
- ❌ Requires npm packages
- ❌ Poor description
- ❌ Doesn't work
- ❌ Duplicate of existing plugin

## 💡 Tips for Success

1. **Test Thoroughly**: Make sure your plugin works before publishing
2. **Clear Description**: Explain what it does and how to use it
3. **Good Naming**: Use descriptive, clear names
4. **Error Handling**: Handle errors gracefully
5. **Documentation**: Add comments in your code
6. **Tags**: Use relevant tags to help users find your plugin

## 🆘 Troubleshooting

### "Invalid JSON format"
- Check your JSON syntax
- Use a JSON validator
- Make sure all quotes are correct

### "Missing required field"
- Ensure all required fields are present
- Check field names match exactly

### "Plugin name already exists"
- Choose a different name
- Make it more specific

### "Code validation failed"
- Remove npm package imports
- Use only Node.js built-ins
- Check for syntax errors

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ubercodex/ubercli/issues)
- **Email**: support@ubercli.com
- **Discussions**: [GitHub Discussions](https://github.com/ubercodex/ubercli/discussions)

## 🎉 Example Plugins

Check out these example plugins for inspiration:

1. **Weather Plugin**: Fetch weather data
2. **Crypto Price**: Get cryptocurrency prices
3. **File Parser**: Parse CSV/JSON files
4. **System Info**: Get system information
5. **Time Converter**: Convert between timezones

Happy plugin creating! 🚀
