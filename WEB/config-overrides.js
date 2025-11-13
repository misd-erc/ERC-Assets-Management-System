const path = require("path");
const { alias } = require("react-app-rewire-alias");

module.exports = function override(config) {
  alias({
    "@": path.resolve(__dirname, "src"),

    "@components": path.resolve(__dirname, "src/components"),
    "@ui": path.resolve(__dirname, "src/components/ui"),
    "@common": path.resolve(__dirname, "src/components/common"),

    "@profile": path.resolve(__dirname, "src/profile"),
    "@audit": path.resolve(__dirname, "src/audit"),
    "@underConstruction": path.resolve(__dirname, "src/under-construction"),

    "@user": path.resolve(__dirname, "src/types/user"),
    "@office": path.resolve(__dirname, "src/types/office"),

    "@types": path.resolve(__dirname, "src/types")
  })(config);

  return config;
};
