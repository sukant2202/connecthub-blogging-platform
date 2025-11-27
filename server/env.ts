import { config } from "dotenv";

const customPath = process.env.DOTENV_CONFIG_PATH;
config(
  customPath
    ? {
        path: customPath,
      }
    : undefined,
);

