> ## Documentation Index
> Fetch the complete documentation index at: https://docs.bfl.ml/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

> From sub-second generation to highest quality — FLUX.2 covers the full spectrum with multi-reference editing, precise color control, and photorealistic output

<img noZoom src="https://cdn.sanity.io/images/2gpum2i6/production/61cc0918403fa5644b7778bce4bd4020e8aef7cd-1920x1440.jpg" style={{ borderRadius: '24px' }} alt="Black Forest" />

**FLUX.2** spans the full spectrum of image generation—from **sub-second inference** with \[klein] to **highest quality** with \[max]. Generate photorealistic images with precise control over colors, poses, and composition, or edit existing images by referencing up to 10 sources simultaneously.

Choose **\[klein]** for real-time, high-volume generation, **\[pro]** for production at scale, **\[flex]** for fine-grained control, or **\[max]** for maximum quality and grounding search.

<Tip>
  **Want to try first?** Test FLUX.2 \[max], \[pro], and \[flex] in our [playground](https://playground.bfl.ai). \[klein] is available via our [API](/flux_2/flux2_text_to_image) and on [Hugging Face](https://huggingface.co/black-forest-labs).
</Tip>

## What Can You Do?

<Tabs>
  <Tab title="Multi-Reference">
    Combine elements from multiple images while maintaining identity across complex scenes. Create ad variants with consistent faces, product mockups in any context, or fashion editorials where models stay consistent.

    <Frame caption="Fashion editorial: 8 consistent characters from reference images">
      <img src="https://cdn.sanity.io/images/2gpum2i6/production/51696bb4ac2972e1dda5f3e68f748210f392c4f4-4861x1863.jpg" />
    </Frame>

    <Frame caption="Character + pose guidance combined">
      <img src="https://cdn.sanity.io/images/2gpum2i6/production/685f20ad37fedb0dcf7cc52c7b012c35734184e9-3392x1967.jpg" />
    </Frame>

    <Frame caption="Input references used for the scene above">
      <img src="https://cdn.sanity.io/images/2gpum2i6/production/18bfb7b7d944ea6081babe2cb26ea3b445c993cf-3453x1863.jpg" />
    </Frame>
  </Tab>

  <Tab title="Photorealism & Detail">
    Generate photorealistic images with enhanced detail, texture, and lighting. FLUX.2 produces images that merge seamlessly with real photography—ideal for e-commerce and product marketing.

    <Columns cols={2}>
      <Frame caption="Cinematic lighting">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/98f466fde69d875943d47cc6238c401d09780537-1440x1152.png" />
      </Frame>

      <Frame caption="Realistic skin texture and lighting">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/e62db22fa2b77c59d28d02d71133623bf1153cdc-1920x1920.jpg" />
      </Frame>
    </Columns>

    <Columns cols={2}>
      <Frame caption="Hyper-realistic close up">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/20370abfd1d798f34419ccd241a068ca1c997ed2-1552x656.png" />
      </Frame>

      <Frame caption="Product photography quality">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/8be740a34ccb79731d3c4f59e67b73ca871b1d06-1552x656.png" />
      </Frame>
    </Columns>
  </Tab>

  <Tab title="Grounding Search">
    Generate images grounded in real-time information with FLUX.2 \[max]. It searches the web when needed, so you can create visuals of yesterday’s football game, the weather in real-time of any cities, or re-create historical events.

    <Columns cols={2}>
      <Frame caption="Score of a previous football game">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/5d9c090250ee74dcd77a9b600bafeb6e53c0f692-1680x1680.jpg" />
      </Frame>

      <Frame caption="The weather in real-time of Freiburg">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/d7b0dd9dfc0236ad763cda9de4b17dea9f455b90-1936x1952.jpg" />
      </Frame>

      <Frame caption="Re-create historical events: 'GC4Q+2V Berlin, Nov. 9th 1989'">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/23784cfd7989338315503484278d66ede410de02-2032x1808.jpg" />
      </Frame>

      <Frame caption="Next Starlink satellite launch">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/13aa8ee65ef34a6a6b43f9417ff0de9dfda7b503-2032x1968.jpg" />
      </Frame>
    </Columns>
  </Tab>

  <Tab title="Typography & Text">
    Reliable text rendering for infographics, UI mockups, and marketing materials.

    <Columns cols={2}>
      <Frame caption="Data visualization with clean typography">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/2355f71eb41d1da454ef3c1b820b3d7ce644bd16-1920x1920.jpg" />
      </Frame>

      <Frame caption="Ad creative with embedded text">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/216bd6da356153b3b3c9d3cce90225fab86fdc43-1440x960.jpg" />
      </Frame>
    </Columns>

    <Columns cols={2}>
      <Frame caption="Magazine cover layout">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/00ddd4ce8b582891f3b174462dc635dac4e45d46-1456x1920.jpg" />
      </Frame>

      <Frame caption="Automotive ad with headline">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/dd06b0f7b82ba5776e09d6827605733dcb5a7526-1456x1920.jpg" />
      </Frame>
    </Columns>
  </Tab>

  <Tab title="Exact Color Control">
    Specify brand colors via hex codes with precision matching. No approximation—get the exact colors you need.

    **Example**: Gradient colors with hex codes

    **Prompt**: `A vase on a table in living room, the color of the vase is a gradient of color, starting with color #02eb3c and finishing with color #edfa3c. The flowers inside the vase have the color #ff0088`

    <Frame caption="Hex colors applied to vase and flowers">
      <img src="https://cdn.sanity.io/images/2gpum2i6/production/3a3bf9b588602adf581f7293611b0e59fd50eadb-1552x1520.png" />
    </Frame>

    **Example**: Multiple hex colors for product design

    **Prompt**: `Luxury eyeshadow palette with 6 pans: top row #B76E79, #E8D5B7, #8B4789; bottom row #CD7F32, #F8F6F0, #800020`

    <Frame caption="Brand color matching">
      <img src="https://cdn.sanity.io/images/2gpum2i6/production/0dc0c7638df1869005b1a502211e5f0bf967dfdc-1024x768.jpg" />
    </Frame>
  </Tab>

  <Tab title="Structured Prompting">
    Use structured prompts for precise control over generation. Perfect for production workflows and automation.

    ```json Example: Structured Prompting theme={null}
    {
      "subject": "Mona Lisa painting by Leonardo da Vinci",
      "background": "museum gallery wall, ornate gold frame",
      "lighting": "soft gallery lighting, warm spotlights",
      "style": "digital art, high contrast",
      "camera_angle": "eye level view",
      "composition": "centered, portrait orientation"
    }
    ```

    <Columns cols={2}>
      <Frame caption="Eye Level View">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/bc12fcb7269c9449f2cbc3b1d1f54c59da4850e3-1456x1424.jpg" />
      </Frame>

      <Frame caption="Worm's Eye View">
        <img src="https://cdn.sanity.io/images/2gpum2i6/production/8c3fa60821f9e0f30de348f7827547cb82b564c9-1456x1424.jpg" />
      </Frame>
    </Columns>
  </Tab>
</Tabs>

## Which Model to Choose?

|                      | **\[klein]**           | **\[max]**                     | **\[pro]**                     | **\[flex]**                    | **\[dev]**            |
| -------------------- | ---------------------- | ------------------------------ | ------------------------------ | ------------------------------ | --------------------- |
| **Best for**         | Real-time, high-volume | Highest quality, final assets  | Production at scale            | Quality with control           | Local development     |
| **Multi-reference**  | Up to 4                | Up to 8 (API), 10 (playground) | Up to 8 (API), 10 (playground) | Up to 8 (API), 10 (playground) | Recommended max 6     |
| **Controls**         | Standard               | Standard                       | Standard                       | Adjustable steps & guidance    | Full customization    |
| **Grounding search** | No                     | Yes                            | No                             | No                             | No                    |
| **Pricing**          | from \$0.014 / image   | from \$0.07 / MP               | from \$0.03 / MP               | \$0.06 / MP                    | Free (non-commercial) |

<Note>
  **FLUX.2 \[klein]** delivers sub-second inference with open weights. 4B runs on consumer GPUs (\~13GB VRAM). Apache 2.0 for 4B, FLUX NCL for 9B. See [model details below](#flux2-klein-models).
</Note>

<Note>
  **FLUX.2 \[max]** includes **grounding search**: when prompted, it performs web searches to access real-time information to visualize trending products, current events, or the latest styles without manually sourcing reference material.
</Note>

## Compare FLUX.2 Models

### At a Glance

<CardGroup cols={2}>
  <Card title="[klein]" icon="rocket">
    **Sub-second inference.** Our fastest models with open weights. Runs on consumer GPUs (\~13GB VRAM). From \$0.014/image via API, or run locally with Apache 2.0 (4B) / FLUX NCL (9B).
  </Card>

  <Card title="[max]" icon="crown">
    **Maximum performance.** Highest editing consistency across tasks. Vast world knowledge. Strongest prompt following and faithful style representation.
  </Card>

  <Card title="[pro]" icon="bolt">
    **Top performance at affordable price.** The high quality, production-grade image editing and generation model.
  </Card>

  <Card title="[flex]" icon="sliders">
    **Specialized for typography.** Best for text rendering and preserving small details.
  </Card>
</CardGroup>

### Use Cases

| **Use Case**            | **FLUX.2 \[klein]**                           | **FLUX.2 \[max]**                           | **FLUX.2 \[pro]**                        | **FLUX.2 \[flex]**                    |
| ----------------------- | --------------------------------------------- | ------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| **Product Marketing**   | Bulk catalog generation, A/B testing variants | Highest quality hero shots for marketplaces | Create ads at scale for social campaigns | Text overlay while preserving details |
| **Movie Making**        | Rapid storyboarding, concept exploration      | Top quality cinematic pre-visualization     | Rapid ideation and static movie banners  | Intros, credits, static advertising   |
| **Creative Platforms**  | Cost-efficient generation for all tiers       | Premium model for highest-tier subs         | High quality backbone at scale           | Specialized text placement            |
| **E-commerce**          | High-volume product variations, thumbnails    | Premium product photography                 | Production-grade catalog images          | Price tags, labels, descriptions      |
| **Editorial & Fashion** | Rapid mood boards, style exploration          | Final hero images                           | Campaign imagery at scale                | Text-heavy layouts                    |

## FLUX.2 \[klein] Models

**FLUX.2 \[klein]** is our fastest model family, delivering state-of-the-art quality with **sub-second inference**. Unifying generation and editing in a single compact architecture, \[klein] is built for applications requiring real-time image generation—and runs on consumer hardware with as little as **13GB VRAM**.

<Columns cols={3}>
  <Frame caption="Editing example">
    <img src="https://cdn.sanity.io/images/2gpum2i6/production/86adb8bf9ea077f3aebe392af1077f0337ed9c48-4544x2805.jpg" alt="FLUX.2 [klein] editing examples" />
  </Frame>

  <Frame caption="Photorealistic quality">
    <img src="https://cdn.sanity.io/images/2gpum2i6/production/41055678178f6fe75ca618b854b195e48dfc55ed-2127x1400.jpg" alt="FLUX.2 [klein] photorealistic examples" />
  </Frame>

  <Frame caption="Diverse styles and subjects">
    <img src="https://cdn.sanity.io/images/2gpum2i6/production/900de0722995119df9f27d799bdfed194d2112ac-2127x1400.jpg" alt="FLUX.2 [klein] diverse output examples" />
  </Frame>
</Columns>

<Info>
  **Open weights available**: \[klein] 4B is fully open under **Apache 2.0**. \[klein] 9B is available under the **FLUX Non-Commercial License**. Download from [Hugging Face](https://huggingface.co/black-forest-labs).
</Info>

### API Models

|                     | **\[klein] 4B**               | **\[klein] 9B**                        |
| ------------------- | ----------------------------- | -------------------------------------- |
| **Best for**        | High volume, local deployment | Balanced quality and speed             |
| **Architecture**    | 4B flow model                 | 9B flow model + 8B Qwen3 text embedder |
| **Inference steps** | 4 (step-distilled)            | 4 (step-distilled)                     |
| **VRAM**            | \~13GB                        | \~24GB                                 |
| **Speed**           | Sub-second                    | Sub-second                             |
| **API Pricing**     | $0.014 + $0.001/MP            | $0.015 + $0.002/MP                     |
| **License**         | Apache 2.0                    | FLUX Non-Commercial License            |

### Open Weights (Community)

The **Base** variants are undistilled foundation models with full training signal—ideal for fine-tuning, LoRA training, research, and custom pipelines. Higher output diversity than distilled models.

|                      | **\[klein] Base 4B**                                     | **\[klein] Base 9B**                                     |
| -------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| **Best for**         | Fine-tuning, research, custom pipelines                  | Maximum quality, research                                |
| **Output diversity** | High                                                     | Highest                                                  |
| **Step-distilled**   | No (full capacity)                                       | No (full capacity)                                       |
| **License**          | Apache 2.0                                               | FLUX Non-Commercial License                              |
| **Availability**     | [Hugging Face](https://huggingface.co/black-forest-labs) | [Hugging Face](https://huggingface.co/black-forest-labs) |

<Note>
  Base models are available as open weights for local development and research. They are not offered on the public API.
</Note>

<Note>
  FLUX.2 \[klein] does not include prompt upsampling. Write detailed, descriptive prompts for best results. See our [prompting guide](/guides/prompting_guide_flux2_klein) for techniques.
</Note>

## Preview Endpoints

Preview endpoints are where our latest improvements land first. They reflect our most recent advances in quality and speed.

| Endpoint                  | Description                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `flux-2-pro-preview`      | Our latest FLUX.2 \[pro] model.                                                                                                  |
| `flux-2-pro`              | A fixed snapshot of FLUX.2 \[pro]. This endpoint will not change, making it suitable for workflows that require reproducibility. |
| `flux-2-klein-9b-preview` | Our latest FLUX.2 \[klein] 9B model with KV caching for improved performance.                                                    |
| `flux-2-klein-9b`         | A fixed snapshot of FLUX.2 \[klein] 9B. Choose this when you need reproducibility.                                               |

<Tip>
  **Which endpoint should I use?** For most use cases, the preview endpoints (`flux-2-pro-preview`, `flux-2-klein-9b-preview`) give you the best results. Choose the non-preview endpoints when you need a pinned model — for example, if your workflow depends on consistent outputs across runs or you have compliance requirements around model stability.
</Tip>

<Note>
  The `flux-2-pro` and `flux-2-klein-9b` endpoints are unchanged. If you are already using them, no action is required.
</Note>

Both preview and non-preview endpoints share the same API contract — the request and response format is identical. Only the underlying model weights differ.

## Technical Specifications

<CardGroup cols={3}>
  <Card title="Resolution" icon="expand">
    * **Output**: Up to 4MP
    * **Input**: 64x64 minimum
    * Any aspect ratio
  </Card>

  <Card title="Multi-Reference" icon="images">
    * Up to 10 input images (\[klein]: 4)
    * Character consistency
    * Style transfer
  </Card>

  <Card title="Advanced Controls" icon="sliders">
    * Pose guidance
    * Hex color matching
    * Structured prompting
    * Grounding search (\[max] only)
  </Card>
</CardGroup>

## Getting Started

<CardGroup cols={2}>
  <Card title="Try in Playground" icon="play" href="https://playground.bfl.ai">
    Test FLUX.2 \[max], \[pro], and \[flex] in your browser. No setup required.
  </Card>

  <Card title="Download [klein] Weights" icon="download" href="https://huggingface.co/black-forest-labs">
    Get \[klein] weights from Hugging Face for local inference.
  </Card>

  <Card title="Text-to-Image API" icon="wand-magic-sparkles" href="/flux_2/flux2_text_to_image">
    Generate images from text prompts.
  </Card>

  <Card title="Image Editing API" icon="pen-to-square" href="/flux_2/flux2_image_editing">
    Edit images with multi-reference support.
  </Card>

  <Card title="[klein] Prompting Guide" icon="graduation-cap" href="/guides/prompting_guide_flux2_klein">
    Master narrative prompting for best \[klein] results.
  </Card>

  <Card title="Local Development" icon="download" href="https://huggingface.co/black-forest-labs/FLUX.2-dev">
    Download \[dev] weights for local inference.
  </Card>
</CardGroup>


Built with [Mintlify](https://mintlify.com).