import serverless from 'serverless-http';
import { createTruthScanApp } from '../../server/app.ts';

const app = createTruthScanApp({ serverless: true });

export const handler = serverless(app, {
  binary: ['application/pdf', 'application/octet-stream', 'image/*'],
});
