# Lens snaps

This repository contains a simple implementation for connecting snaps to the Lens Apolo API.

## Features

* Display the Lens profiles connected to your account addresses.

* Display the Lens profiles connected to the `to` and `from` addresses in your transactions.

### Notice

This is a work in progress. The code is not audited and should not be used in production.

Currently the integration is impossible to work.

Apolo doesn't know how to handle requests from the [sandbox iframe environment](https://docs.metamask.io/snaps/reference/permissions/#same-origin-policy-and-cors) yet.

When the snap deploys to production, the Origin parameter will not be null anymore, and this should work eventually.

> fetch() requests in a Snap are bound by the browser's same-origin policy. Since Snap code is executed in an iframe with the sandbox property, the browser sends an Origin header with the value null with outgoing requests. For the Snap to be able to read the response, the server must send an Access-Control-Allow-Origin CORS header with the value * or null in the response.

## Credits

This project was bootstrapped with [gas-estimation-snap](https://docs.metamask.io/snaps/tutorials/gas-estimation/)

Thanks for Metamask team for the great documentation and tutorials, and for Consensys team for the amazing Ambassadors program.
