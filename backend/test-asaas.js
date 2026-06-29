import "dotenv/config";

const apiKey = process.env.ASAAS_API_KEY;

fetch("https://api-sandbox.asaas.com/v3/customers", {
  headers: {
    access_token: apiKey,
  },
})
  .then(async (r) => {
    console.log(r.status);
    console.log(await r.text());
  })
  .catch(console.error);