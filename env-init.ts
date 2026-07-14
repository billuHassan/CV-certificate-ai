// env-init.ts
// This file MUST be imported before any Google SDK libraries to prevent ACCESS_TOKEN_TYPE_UNSUPPORTED errors in Cloud Run containers.
process.env.GCP_METADATA_HOST = "127.0.0.1";
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.GOOGLE_GCLOUD_ADC_PATH;
delete process.env.K_SERVICE;
delete process.env.K_REVISION;
delete process.env.K_CONFIGURATION;
