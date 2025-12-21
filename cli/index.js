#!/usr/bin/env node
const { Command } = require("commander");
const { execa } = require("execa");
const { join } = require("node:path");
const fs = require("fs/promises");

const program = new Command();

program.name("neko").description("CLI for my UI library").version("0.1.0");

program
  .command("generate <name>")
  .description("Generate a new UI component")
  .action(async (name) => {
    try {
      const componentsDir = join(process.cwd(), "src", "components");
      const componentDir = join(componentsDir, name);

      // 1️⃣ Check if folder exists
      try {
        await fs.access(componentDir);
        console.error(`Component "${name}" already exists! Aborting.`);
        process.exit(1);
      } catch {
        // Folder doesn't exist → OK
      }

      // 2️⃣ Create folder
      await fs.mkdir(componentDir, { recursive: true });

      // 3️⃣ Create files
      const files = {
        [`${name}.tsx`]: `import React from 'react';
import { View } from 'react-native';
import type { ${name}Props } from './${name}.types';

export const ${name} = (props: ${name}Props) => {
  return <View>{props.children}</View>;
};
`,
        [`${name}.types.ts`]: `import React from 'react';

export interface ${name}Props {
  children?: React.ReactNode;
}
`,
        [`${name}.stories.tsx`]: `import React from 'react';
import { ${name} } from './${name}';

export default {
  title: 'Components/${name}',
  component: ${name},
};

export const Default = () => <${name}>Hello</${name}>;
`,
        [`index.ts`]: `export { ${name} } from './${name}';
export type { ${name}Props } from './${name}.types';
`,
      };

      for (const [filename, content] of Object.entries(files)) {
        await fs.writeFile(join(componentDir, filename), content, "utf8");
      }

      // 4️⃣ Update src/components/index.ts
      const componentsIndex = join(componentsDir, "index.ts");
      let indexContent = "";
      try {
        indexContent = await fs.readFile(componentsIndex, "utf8");
      } catch {
        // file doesn't exist → create new
        indexContent = "";
      }

      const exportLine = `export * from "./${name}";`;
      if (!indexContent.includes(exportLine)) {
        indexContent += indexContent.endsWith("\n") ? "" : "\n";
        indexContent += exportLine + "\n";
        await fs.writeFile(componentsIndex, indexContent, "utf8");
      }

      console.log(`✅ Component "${name}" created successfully!`);
    } catch (err) {
      console.error("Error generating component:", err);
      process.exit(1);
    }
  });

program
  .command("delete <name>")
  .description("Delete a UI component")
  .action(async (name) => {
    try {
      const componentsDir = join(process.cwd(), "src", "components");
      const componentDir = join(componentsDir, name);

      // 1️⃣ Check if folder exists
      try {
        await fs.access(componentDir);
      } catch {
        console.error(`Component "${name}" does not exist! Aborting.`);
        process.exit(1);
      }

      // 2️⃣ Remove the folder recursively
      await fs.rm(componentDir, { recursive: true, force: true });
      console.log(`✅ Component folder "${name}" deleted.`);

      // 3️⃣ Update src/components/index.ts
      const componentsIndex = join(componentsDir, "index.ts");
      try {
        let indexContent = await fs.readFile(componentsIndex, "utf8");
        const exportLine = `export * from "./${name}";`;

        if (indexContent.includes(exportLine)) {
          indexContent = indexContent
            .split("\n")
            .filter((line) => line.trim() !== exportLine)
            .join("\n")
            .trim();

          // Ensure file ends with newline if non-empty
          if (indexContent.length) indexContent += "\n";

          await fs.writeFile(componentsIndex, indexContent, "utf8");
          console.log(`✅ Removed export line from index.ts`);
        }
      } catch {
        // file doesn't exist → nothing to remove
      }

      console.log(`✅ Component "${name}" deleted successfully!`);
    } catch (err) {
      console.error("Error deleting component:", err);
      process.exit(1);
    }
  });

program
  .command("start")
  .description("Starting the UI Library Demo App")
  .action(async () => {
    await execa("npm", ["run", "start"], {
      stdio: "inherit",
    });
  });

program.parse();
