import type {
  OnRpcRequestHandler,
  OnTransactionHandler,
} from '@metamask/snaps-sdk';
import { heading, panel, text } from '@metamask/snaps-sdk';

const API_URL = 'https://api-v2-mumbai-live.lens.dev/';

async function getHandle(address: string) {
  const response = await fetch(API_URL, {
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
    },
    body: `{"query":"query Query($request: OwnedHandlesRequest!) {\\n  ownedHandles(request: $request) {\\n    items {\\n      id\\n      fullHandle\\n      namespace\\n      localName\\n      suggestedFormatted {\\n        full\\n        localName\\n      }\\n      linkedTo {\\n        contract {\\n          address\\n          chainId\\n        }\\n        nftTokenId\\n      }\\n      ownedBy\\n      \\n    }\\n    pageInfo {\\n      prev\\n      next\\n    }\\n  }\\n}","variables":{"request":{"for":"${address}"}},"operationName":"Query"}`,
    method: 'POST',
  });
  return response.text();
}

function getHandles(addresses: string[]) {
  return Promise.all(addresses.map(getHandle));
}

async function getProfiles(addresses: string[]) {
  const addressArray = JSON.stringify(addresses);
  const response = await fetch(API_URL, {
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
    },
    body: `{\"query\":\"query Profiles($request: ProfilesRequest!, ) {\\n profiles(request: $request) {\\n items {\\n id\\n ownedBy {\\n address\\n chainId\\n }\\n txHash\\n createdAt\\n stats {\\n id\\n followers\\n following\\n comments\\n posts\\n mirrors\\n quotes\\n publications\\n reactions\\n reacted\\n countOpenActions\\n }\\n operations {\\n id\\n isBlockedByMe {\\n value\\n isFinalisedOnchain\\n }\\n hasBlockedMe {\\n value\\n isFinalisedOnchain\\n }\\n isFollowedByMe {\\n value\\n isFinalisedOnchain\\n }\\n isFollowingMe {\\n value\\n isFinalisedOnchain\\n }\\n canBlock\\n canUnblock\\n canFollow\\n canUnfollow\\n }\\n interests\\n guardian {\\n protected\\n cooldownEndsOn\\n }\\n invitedBy {\\n id\\n txHash\\n createdAt\\n interests\\n invitesLeft\\n signless\\n sponsor\\n }\\n invitesLeft\\n onchainIdentity {\\n proofOfHumanity\\n ens {\\n name\\n }\\n sybilDotOrg {\\n verified\\n source {\\n twitter {\\n handle\\n }\\n }\\n }\\n worldcoin {\\n isHuman\\n }\\n }\\n followNftAddress {\\n address\\n chainId\\n }\\n metadata {\\n displayName\\n bio\\n rawURI\\n appId\\n attributes {\\n type\\n key\\n value\\n }\\n picture {\\n ... on ImageSet {\\n raw {\\n mimeType\\n width\\n height\\n uri\\n }\\n optimized {\\n mimeType\\n width\\n height\\n uri\\n }\\n }\\n ... on NftImage {\\n collection {\\n address\\n chainId\\n }\\n tokenId\\n image {\\n raw {\\n mimeType\\n width\\n height\\n uri\\n }\\n optimized {\\n mimeType\\n width\\n height\\n uri\\n }\\n }\\n verified\\n }\\n }\\n coverPicture {\\n raw {\\n mimeType\\n width\\n height\\n uri\\n }\\n optimized {\\n mimeType\\n width\\n height\\n uri\\n }\\n }\\n }\\n followModule {\\n ... on FeeFollowModuleSettings {\\n type\\n contract {\\n address\\n chainId\\n }\\n amount {\\n asset {\\n ... on Erc20 {\\n name\\n symbol\\n decimals\\n contract {\\n address\\n chainId\\n }\\n }\\n }\\n value\\n }\\n recipient\\n \\n }\\n ... on RevertFollowModuleSettings {\\n contract {\\n address\\n chainId\\n }\\n type\\n }\\n ... on UnknownFollowModuleSettings {\\n contract {\\n address\\n chainId\\n }\\n type\\n followModuleReturnData\\n }\\n }\\n handle {\\n id\\n fullHandle\\n namespace\\n localName\\n suggestedFormatted {\\n full\\n localName\\n }\\n linkedTo {\\n contract {\\n address\\n chainId\\n }\\n nftTokenId\\n }\\n ownedBy\\n }\\n signless\\n sponsor\\n }\\n pageInfo {\\n prev\\n next\\n }\\n }\\n}\",\"variables\":{\"request\":{\"where\":{\"ownedBy\":${addressArray}}}},\"operationName\":\"Profiles\"}`,
    method: 'POST',
  });
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
    case 'lens_getProfiles':
      return ethereum
        .request({ method: 'eth_requestAccounts' })
        .then((accounts) =>
          getProfiles(accounts as string[]).then((response) =>
            snap.request({
              method: 'snap_dialog',
              params: {
                type: 'alert',
                content: panel([
                  text(`Hello, **${origin}**!`),
                  text(displayProfiles(response)),
                ]),
              },
            }),
          ),
        );
    case 'lens_getHandles':
      return ethereum
        .request({ method: 'eth_requestAccounts' })
        .then((accounts) =>
          getHandles(accounts as string[]).then((response) =>
            snap.request({
              method: 'snap_dialog',
              params: {
                type: 'alert',
                content: panel([
                  text(`Hello, **${origin}**!`),
                  text(displayHandles(response)),
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

function displayHandles(response: string | string[]) {
  const parsedResponses =
    typeof response === 'string'
      ? [JSON.parse(response)]
      : response.map((r) => JSON.parse(r));
  const items = parsedResponses
    .flatMap((response: any) => response?.data?.ownedHandles?.items || [])
  if (items.length === 0) {
    return 'No handles found';
  }
  const message = `Found ${items.length} handle${
    items.length > 1 ? 's' : ''
  }:\n\n ${items
    .map(
      (item, index) =>
        `--Handle number ${++index}: ${item.suggestedFormatted?.localName}\n\n (${
          item.suggestedFormatted?.full
        })`,
    )
    .join('\n\n')}`;
  return message;
}

function displayProfiles(response: string | string[]) {
  const parsedResponses =
    typeof response === 'string'
      ? [JSON.parse(response)]
      : response.map((r) => JSON.parse(r));
  const items = parsedResponses
    .flatMap((response: any) => response?.data?.profiles?.items || [])
  if (items.length === 0) {
    return 'No profiles found';
  }
  const message = `Found ${items.length} profile${
    items.length > 1 ? 's' : ''
  }:\n\n ${items
    .map(
      (profile, index) =>
        `--Profile number ${++index}\n\n \n\nName: ${profile.metadata?.displayName}\n\nBio: ${
          profile.metadata?.bio
        }\n\nPicture: ${profile.metadata?.picture?.raw?.uri}\n\nCover Picture: ${
          profile.metadata?.coverPicture?.raw?.uri
        }\n\nHandle: ${
          profile.handle?.suggestedFormatted?.full
        }\n\nHandle Contract: ${
          profile.handle?.linkedTo?.contract?.address
        }\n\nHandle NFT Token ID: ${
          profile.handle?.linkedTo?.nftTokenId
        }\n\nHandle Owned By: ${profile.handle?.ownedBy}\n\nHandle ID: ${
          profile.handle?.id
        }\n\nHandle Full Handle: ${
          profile.handle?.fullHandle
        }\n\nHandle Namespace: ${profile.handle?.namespace}\n\nHandle Local Name: ${
          profile.handle?.localName
        }\n\nHandle Suggested Formatted Full: ${
          profile.handle?.suggestedFormatted?.full
        }\n\nHandle Suggested Formatted Local Name: ${
          profile.handle?.suggestedFormatted?.localName
        }\n\nHandle Linked To Contract Address: ${
          profile.handle?.linkedTo?.contract?.address
        }\n\nHandle Linked To Contract Chain ID: ${
          profile.handle?.linkedTo?.contract?.chainId
        }\n\nHandle Linked To NFT Token ID: ${
          profile.handle?.linkedTo?.nftTokenId
        }\n\nHandle Owned By: ${profile.handle?.ownedBy}\n\nSignless: ${
          profile.signless
        }\n\nSponsor: ${profile.sponsor}\n\n`,
    )
    .join('\n\n')}`;
  return message;
}
