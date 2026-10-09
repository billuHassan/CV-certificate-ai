// env-init.ts
// Environment preparation for Google GenAI SDK & Cloud deployment
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.GOOGLE_GCLOUD_ADC_PATH;
delete process.env.K_SERVICE;
delete process.env.K_REVISION;
delete process.env.K_CONFIGURATION;

