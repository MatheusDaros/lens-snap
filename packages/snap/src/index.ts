import type {
  OnRpcRequestHandler,
  OnTransactionHandler,
} from '@metamask/snaps-sdk';
import { heading, panel, text } from '@metamask/snaps-sdk';

const API_URL = 'https://api-v2-mumbai-live.lens.dev/';

async function getProfiles(addresses: any) {
  const addressArray = JSON.stringify(addresses);
  const response = await fetch('https://api-v2-mumbai-live.lens.dev/', {
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
    },
    body: `{\"query\":\"query Profile($request: ProfilesRequest!) {\\n  profiles(request: $request) {\\n    items {\\n      id\\n      txHash\\n      createdAt\\n      interests\\n      invitesLeft\\n      signless\\n      sponsor\\n    }\\n    pageInfo {\\n      next\\n      prev\\n    }\\n  }\\n}\",\"variables\":{\"request\":{\"where\":{\"ownedBy\":${addressArray}}}},\"operationName\":\"Profile\"}`,
    method: 'POST',
  });
  return response.text();
}

async function getFees() {
  const response = await fetch('https://beaconcha.in/api/v1/execution/gasnow');
  return response.text();
}

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'hello':
      return getFees().then((fees) => {
        return snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              text(`Hello, **${origin}**!`),
              text(`Current gas fee estimates: ${fees}`),
            ]),
          },
        });
      });
    case 'lens_getUser':
      return ethereum
        .request({ method: 'eth_requestAccounts' })
        .then((accounts) =>
          getProfiles(accounts).then((response) =>
            snap.request({
              method: 'snap_dialog',
              params: {
                type: 'confirmation',
                content: panel([
                  text(`Hello, **${origin}**!`),
                  text(
                    `These are your Lens Profiles: ${JSON.stringify(response)}`,
                  ),
                  text(
                    `Apolo doesn't know how to handle requests from the sandbox yet, so this is just a placeholder. When the snap deploys to production, the Origin parameter will not be null anymore, and this should work eventually`,
                  ),
                ]),
              },
            }),
          ),
        );
    default:
      throw new Error('Method not found.');
  }
};

export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  const insights = getProfiles([transaction.from, transaction.to]);
  return {
    content: panel([
      heading('Lens insights'),
      text(`Lens profiles for this transaction: ${insights}`),
    ]),
  };
};
