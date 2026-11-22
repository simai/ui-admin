# Instructions for AI assistants

This project is a documentation site built with Docara, a static site generator.
Pages are Markdown files in `content/ru/`; site settings are in `docara.json`.
Page language: `ru`. Write new pages in that language.
You may edit this file; Docara never overwrites it.

## Documentation standard

Every page has one type. Set it with `profile:` in front matter, or let a rule in
`docara.authoring.json` set it by path. Each type has required parts:

| Type | Use it for | Required parts |
| --- | --- | --- |
| `landing` | An entry page of the site or a section that sends the reader on. | Exactly one `#` title; an introduction paragraph under the title; at least two `##` sections; a link or a component that leads to the next action. |
| `article` | A page that fits no other type. | Exactly one `#` title; an introduction paragraph under the title; at least one `##` section. |
| `tutorial` | A first, guided lesson from start to a working result. | Exactly one `#` title; a numbered list of at least two steps. |
| `how_to` | Steps for one practical task the reader already wants to do. | Exactly one `#` title; a numbered list of at least two steps. |
| `reference` | Exact facts to look up: options, fields, commands, codes. | Exactly one `#` title; an introduction paragraph under the title; a table, a list, a code block or a component block. |
| `explanation` | Why something works the way it does, its design and limits. | Exactly one `#` title; an introduction paragraph under the title; at least one `##` section. |

Sections of each type, in order (write the headings in the page language):

- `landing`: Start here, Next steps, See also.
- `article`: Main part, See also.
- `tutorial`: Before you start, Steps, Result, See also.
- `how_to`: Before you start, Steps, Result, See also.
- `reference`: Parameters, See also.
- `explanation`: How it works, Why it works this way, Limitations, See also.

Directories of the skeleton: `getting-started/` (tutorial), `how-to/` (how_to),
`reference/` (reference), `explanation/` (explanation).

## Writing rules

- One topic per page. Split a page that answers two questions.
- Short sentences in plain words. Explain a term the first time it appears.
- Task-oriented titles: name what the reader does or learns ("Publish the site", not "Publishing").
- Every page has a `description` in front matter: one sentence about what the reader gets.
- End the page with a "См. также" section that links related pages.
- Every image has alt text that says what the image shows.
- No text inside images: put words, commands and numbers in the Markdown text.
- Use the page type that matches the reader's goal and keep its required parts.

## Diagrams

Draw a diagram with `:::diagram {engine=mermaid title="..."}` and Mermaid source inside;
any Mermaid type works. Pick it by purpose: `flowchart` for steps and decisions,
`sequenceDiagram` for requests between parts, `stateDiagram-v2` for states,
`erDiagram` or `classDiagram` for data and code models, `C4Context` or
`architecture-beta` for systems, `gantt`, `timeline` or `gitGraph` for plans and
history, `pie`, `xychart-beta` or `sankey-beta` for numbers. Write `sankey-beta`
labels in Latin letters only; put non-Latin labels of `architecture-beta` and
`xychart-beta` in double quotes.

## Component parameters

One name, one meaning: `type` is a status, `variant` a style, `layout` an arrangement,
`ratio` is `16/9`; former names (badge `type`, details `view`) report `MARKDOWN_PARAMETER_DEPRECATED`. Code fences take options in braces: ```` ```php {title="app.php" highlight="2-3" numbers} ````; `// [!code ++]` / `[!code --]` mark changed lines, `layout=terminal` shows commands.

## Create a page

Start every new page from a template of its type:

```bash
php vendor/bin/docara scaffold page <route> --type <type> --title "<Title>"
php vendor/bin/docara scaffold page how-to/publish-the-site --type how_to --title "Publish the site"
```

The page gets the sections of its type, a `description` placeholder and
`draft: true`. Replace every placeholder, then remove `draft: true` so the
page is published. With `templates` in `docara.authoring.json`, start a page of that kind with `--template <id>` and keep its sections (`validate page` reports `PAGE_TEMPLATE_*`); never edit text between `docara:generated` markers.

## Check before you finish

Run these commands and fix what they report:

```bash
php vendor/bin/docara validate page <route>
php vendor/bin/docara validate project
php vendor/bin/docara build production
php vendor/bin/docara verify-static build_production
php vendor/bin/docara qa report --env=production
php vendor/bin/docara qa review-packet <route> --env=production
```

`validate page` lists missing parts as `PAGE_PROFILE_*_MISSING`. A page without
a type gets a guessed one (`PAGE_PROFILE_INFERRED`); set `profile:` to confirm
it. `PAGE_EDITORIAL_REVIEW_REQUIRED` lists questions only a reader can answer:
reread the page against them.

`qa report` scores the built site (completeness, freshness, findability,
readability, accessibility, links) and lists what to fix first. For every page
you wrote or changed, run `qa review-packet <route>` and answer each question of
the packet (`build_production.docara/review-packets/`): is every statement true
to its sources, is it clear for its audience, does it solve the task, do the
examples work. Fix the page where the answer is no. Docara itself never calls an AI.

The machine-readable form of this guide: `php vendor/bin/docara capabilities --json`,
field `documentation_standard`. For settings, components, updates and errors, install the Docara agent skill: https://github.com/simai/ai-skill-docara
