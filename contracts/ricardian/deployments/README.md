# Deployment Configuration

## Addresses

Deployment addresses are stored in `addresses.json` to keep them separate from the deployment plan files.

### Structure

```json
{
  "testnet": {
    "deployer": "STVAH96MR73TP2FZG2W4X220MEB4NEMJHPMVYQNS",
    "remapPrincipals": {
      "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9": "STVAH96MR73TP2FZG2W4X220MEB4NEMJHPMVYQNS",
      "ST1NXBK3K5YYMD6FD41MVNP3JS1GABZ8TRVX023PT": "STVAH96MR73TP2FZG2W4X220MEB4NEMJHPMVYQNS"
    }
  },
  "mainnet": {
    "deployer": "",
    "remapPrincipals": {}
  }
}
```

## Deployment Plan

The deployment plan file (`default.testnet-plan.yaml`) uses placeholders `{{DEPLOYER}}` that need to be replaced with actual addresses from `addresses.json` before deployment.

### Usage

Before deploying, replace `{{DEPLOYER}}` in the YAML file with the deployer address from `addresses.json`, or use a script to do this automatically.

### Example Script

```bash
#!/bin/bash
DEPLOYER=$(jq -r '.testnet.deployer' addresses.json)
sed "s/{{DEPLOYER}}/$DEPLOYER/g" default.testnet-plan.yaml.template > default.testnet-plan.yaml
```

## Security Note

⚠️ **Important**: The `addresses.json` file contains sensitive deployment addresses. Do not commit this file to version control if it contains production addresses. Consider using environment variables or a secrets management system for production deployments.

