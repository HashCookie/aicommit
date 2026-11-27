import { FeatureSelector } from "@/components/feature-selector";
import { Section } from "@/components/section";
import { codeToHtml } from "shiki";

interface FeatureOption {
  id: number;
  title: string;
  description: string;
  code: string;
}

const featureOptions: FeatureOption[] = [
  {
    id: 1,
    title: "Interactive Commit",
    description:
      "Stage your changes and let AI draft a Conventional Commit message.",
    code: `# Stage files and generate a commit message
git add .
aicommit

# ? Generated commit message:
#   feat: add token verification helper
#
# What would you like to do?
# ❯ Accept
#   Edit
#   Regenerate
#   Cancel`,
  },
  {
    id: 2,
    title: "One-Line Auto Commit",
    description:
      "Auto-stage tracked files, pass context, and commit without prompts.",
    code: `# Auto-stage tracked files (-a), add context (-c), and skip confirmation (-y)
aicommit -a -y -c "fix Safari date parsing compatibility"

# Commit message:
#   fix: replace hyphens with slashes in date parsing for Safari compatibility
# [main 5e8d9f5] fix: replace hyphens with slashes in date parsing for Safari compatibility`,
  },
  {
    id: 3,
    title: "Branch Name Generator",
    description:
      "Generate a clean branch slug from your diff and checkout automatically.",
    code: `# Generate and checkout a semantic branch
aicommit branch
# or shorthand: aicommit b

# ? Select branch prefix: feat
# ? Generated branch name:
#   feat/replace-axios-with-fetch
#
# Branch created and switched to: feat/replace-axios-with-fetch`,
  },
  {
    id: 4,
    title: "Interactive Setup & Ollama",
    description:
      "Configure provider, key, and language — or run offline with Ollama.",
    code: `# Guided setup wizard
aicommit setup

# Or use local Ollama with zero API keys
aicommit config set AI_PROVIDER=ollama
aicommit config set AI_MODEL=llama3.2

# Switch commit language to Simplified Chinese
aicommit config set AI_LOCALE=zh`,
  },
];

export async function Examples() {
  const features = await Promise.all(
    featureOptions.map(async (feature) => ({
      ...feature,
      code: await codeToHtml(feature.code, {
        lang: "bash",
        theme: "github-dark",
      }),
    }))
  );

  return (
    <Section id="examples">
      <div className="border-x border-t">
        <FeatureSelector features={features} />
      </div>
    </Section>
  );
}
