> ## Documentation Index
> Fetch the complete documentation index at: https://docs.bfl.ml/llms.txt
> Use this file to discover all available pages before exploring further.

# FLUX.2 [klein] Style Training

> Technical guide for training style LoRAs on FLUX.2 [klein] models on Graphic Impressions Style

<img noZoom src="https://cdn.sanity.io/images/2gpum2i6/production/e09038959c1ec2beaa3aeb077974ffd7b928471b-1440x1072.png" style={{ borderRadius: '24px' }} alt="FLUX.2 [klein] Training Example" />

***

## Overview

This example walks through training a style LoRA using a fully synthetic dataset — images generated with FLUX.1 \[dev] and various illustrative LoRAs at different strengths.

### Output Characteristics

The resulting style has painterly brushwork with strong graphic structure — bold shapes, deep shadows, saturated but limited colors. Edges go between soft and sharp, giving it a hand-painted feel.

<img src="https://cdn.sanity.io/images/2gpum2i6/production/8d10fda289e02ec6b7f58a129839a3a92214553b-1024x1024.png" alt="Style example" style={{ borderRadius: '8px', marginTop: '16px', marginBottom: '16px' }} />

***

## Training Pipeline

Training has three parts that need to work together:

1. **Training Data** – Source material the model learns from
2. **Configuration Parameters** – Training behavior and optimization targets
3. **Sampling Settings** – Inference-time extraction of learned characteristics

***

## Part 1: Dataset Preparation Example

### Dataset Size Requirements

Optimal dataset size: 20-40 images

* Below 20 images: Insufficient variation for generalization
* Above 40 images: Style dilution through excessive variation

Dataset composition should include diverse angles, subjects, and compositions to enable aesthetic generalization rather than scene memorization.

**This example uses:** 27 training images with corresponding caption files.

**Training Dataset:**

<CardGroup cols={4}>
  <img src="https://cdn.sanity.io/images/2gpum2i6/production/1f64cb50e9b00262364e7a673afd2adb569d2d91-2752x1536.png" alt="Training 1" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/1fbadcc53bbcd32842d831784d748a670e90d74b-2752x1536.png" alt="Training 2" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/6a4a082ad54270231bf49a3c7214c9ae28ea9343-2752x1536.png" alt="Training 3" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/46c9da229a3a756e0f1dd85b411432858ff99258-2752x1536.png" alt="Training 4" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/f064f92f9c6904fa60bb827bde5f50da7120b3ee-2752x1536.png" alt="Training 5" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/5248fa9f913969ad7e07716373ae08132d23678a-2752x1536.png" alt="Training 6" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/548352f8acf5f67b3e0258541aeeda6b5ea8ab03-2752x1536.png" alt="Training 7" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/e5cef902965bbb1ccacb39e1f34c0464162a25ed-2752x1536.png" alt="Training 8" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/30db164600d191cdd906753ced19b1cc9d9df1c0-2752x1536.png" alt="Training 9" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/86886f62f6cc4536aab0b846b2a157f029e0cc2b-2752x1536.png" alt="Training 10" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/230eac6b178fca0801fd8f6dafda6a9a06aca4f7-2752x1536.png" alt="Training 11" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/aef54299d95e1afe391ba48473daa306e29e6afb-2752x1536.png" alt="Training 12" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/d748a200bf42a04924737c212168fba5d39d2412-2752x1536.png" alt="Training 13" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/b7e29f13db0de89f893f955993b212f5dfb415a7-2752x1536.png" alt="Training 14" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/d4c30c87baaed75eb8d867d3ad8abef24636fd7c-2752x1536.png" alt="Training 15" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/e61498a50614678d1ac3c235be50d375983a652e-2752x1536.png" alt="Training 16" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/622e2e96197cc6f1d6ddbda09ad6623f0f0f3832-2752x1536.png" alt="Training 17" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/9ab4da45e77e5feeb45c8cea647dd2b7df88f9ee-2752x1536.png" alt="Training 18" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/27532886f3f3fe38e6ff8428a4a8c64eb3d15a03-2752x1536.png" alt="Training 19" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/cbcb4651e2144cdbf6070c2d7bc216a7d611e5ad-2752x1536.png" alt="Training 20" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/fabccde500aa1a5ed6774963d9f41b951e8d8102-2752x1536.png" alt="Training 21" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/1b357d36054b9ec27e970a162391a1c4ca2b03a9-2752x1536.png" alt="Training 22" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/5569f32aa3a4cafe32ca8ed27e312e829a2567e0-2752x1536.png" alt="Training 23" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/f46e945fbc6a0fe8da088c9d073c3aae1ec472cc-2752x1536.png" alt="Training 24" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/80815c377e407d3ff241231d579582c108c94f36-2752x1536.png" alt="Training 25" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/869305dbfda66ea80886c39fce93e4a559b15a7d-2752x1536.png" alt="Training 26" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/854df51da05db3759e024782bb11fa62381ab353-2752x1536.png" alt="Training 27" style={{ borderRadius: '8px' }} />
</CardGroup>

### Caption Strategy for Style Training

Captions should only describe what's in the image — no style descriptors. With a small dataset, the model strongly associates text with visuals. If you leave out style descriptions, it's forced to learn the visual style implicitly from the images themselves.

A unique trigger word (e.g. `GFX_IMPR5N`) in every caption gives you a way to activate the style at inference without polluting the base model's vocabulary.

### Caption Example

<img src="https://cdn.sanity.io/images/2gpum2i6/production/6a4a082ad54270231bf49a3c7214c9ae28ea9343-2752x1536.png" alt="Scorpion training example" style={{ borderRadius: '8px', maxWidth: '400px' }} />

**Caption:**

*GFX\_IMPR5N. Close Up Three Quarter Left of a scorpion standing on a rounded rock surface. The scorpion's body angles from the lower left toward the upper right, with both pincers extended forward and the segmented tail arched upward over the back ending in a stinger. Multiple legs are spread to either side, and the abdomen shows distinct segment divisions. The rock occupies the lower foreground, with the scorpion centered above it against an open background.*

**Omitted descriptors:** Solid black background, red highlight, painterly brushstrokes

### File Structure

```
gfx_imp_dataset/
├── GFX_IMP (1).png
├── GFX_IMP (1).txt
├── GFX_IMP (2).png
├── GFX_IMP (2).txt
├── GFX_IMP (3).png
├── GFX_IMP (3).txt
└── ... (27 images total)
```

<Accordion title="View All 27 Captions">
  `GFX_IMP (1).txt`:

  ```
  GFX_IMPR5N. Waist Up Medium Shot Three Quarter Right of a person wearing a wide-brim cowboy hat and a suit jacket over a collared shirt and tie. The person is centered in the frame with shoulders squared and head slightly tilted upward, looking past the camera. Face details: long face shape, angled jawline, narrow pointed chin, prominent cheekbones, medium-height forehead, pronounced brow ridge, thick straight eyebrows, deep-set almond eyes, straight narrow nose bridge, narrow nostrils, thin upper lip with fuller lower lip, mouth slightly open with teeth not visible, clean-shaven cheeks and chin, short hair visible at the sides under the hat, medium ears slightly protruding. Wooden building facades sit in the left and right background, with a utility pole and wires behind the person on the right side, and scattered clouds in the sky.
  ```

  `GFX_IMP (2).txt`:

  ```
  GFX_IMPR5N. Medium Shot Profile Left of a shirtless person standing beside a multi-pane window. The person occupies the right half of the frame, torso angled slightly toward the window, head bowed with eyes closed. Face details: oval-to-long face shape, sharp jawline, pointed chin, defined cheekbones, medium forehead height, visible brow ridge, thick eyebrows, closed eyelids with hooded lids, straight narrow nose bridge, small nostrils, thin lips with mouth closed, clean-shaven jaw and upper lip, short hair with a messy fringe, visible ear with average size. The window fills the left background with vertical and horizontal muntins, while hanging drapery and wall panels appear in the upper right background.
  ```

  `GFX_IMP (3).txt`:

  ```
  GFX_IMPR5N. Close Up Three Quarter Left of a scorpion standing on a rounded rock surface. The scorpion's body angles from the lower left toward the upper right, with both pincers extended forward and the segmented tail arched upward over the back ending in a stinger. Multiple legs are spread to either side, and the abdomen shows distinct segment divisions. The rock occupies the lower foreground, with the scorpion centered above it against an open background.
  ```

  `GFX_IMP (4).txt`:

  ```
  GFX_IMPR5N. Shoulder Up Close Up Profile Right of two people lying face-to-face with their noses nearly touching. The left person fills the left foreground facing right, and the right person fills the right foreground facing left, with their cheeks and lips separated by a small gap; an arm wraps across the lower left foreground around the other person's shoulder. Left person face details: oval face shape, soft jawline, rounded chin, high cheekbones, medium forehead height, smooth brow ridge, thick arched eyebrows, closed eyelids with long lashes, straight nose bridge with a small rounded tip, medium-width lips with mouth closed, visible ear with a hoop earring, hair pulled back into a bun, no facial hair. Right person face details: long face shape, angular jawline, pointed chin, defined cheekbones, medium forehead height, pronounced brow ridge, thick eyebrows, closed eyelids, straight narrow nose bridge, fuller lips with mouth slightly open and teeth not visible, visible ear with average size, short hair swept back, clean-shaven cheeks and chin. Diagonal bands cross parts of both faces and necks, and the background is a bed surface with rumpled fabric.
  ```

  `GFX_IMP (5).txt`:

  ```
  GFX_IMPR5N. Shoulder Up Close Up Frontal of a person framed by flowering stems and leaves in the foreground. The person is slightly left of center, facing the camera with a neutral mouth and direct gaze; one flower overlaps one eye and another flower overlaps the upper forehead area. Face details: oval face shape, soft jawline, pointed chin, prominent cheekbones, short forehead hidden by blunt bangs, thick straight eyebrows, almond-shaped eyes with average spacing (one eye partially obscured), straight narrow nose bridge, small rounded nose tip, narrow nostrils, full lips with a defined cupid's bow, mouth closed with no teeth visible, clean-shaven face, long straight hair with blunt bangs and thick density. Plant leaves and flower heads overlap the lower foreground and the left edge, while the background is a plain wall with faint vertical seams.
  ```

  `GFX_IMP (6).txt`:

  ```
  GFX_IMPR5N. Medium Wide Shot Frontal of a person running toward the camera inside a narrow corridor lined with large rectangular panels on both sides. The runner is centered low in the frame, leaning forward with one arm bent and driving forward and the other arm pulled back, gaze fixed ahead. Face details: square face shape, strong angular jawline, squared chin, pronounced cheekbones, medium forehead height, prominent brow ridge, thick eyebrows, narrow eyes, straight nose bridge with medium width, small nostrils, thin lips pressed together, clean-shaven cheeks and chin, short wavy hair with a messy front, ears partially visible. The person wears a suit jacket over a high-collared top, and the corridor's parallel walls and ceiling lines converge toward a vanishing point in the upper center background.
  ```

  `GFX_IMP (7).txt`:

  ```
  GFX_IMPR5N. Full Body Shot Frontal of a kneeling person with large feathered wings spread wide behind them. The person is centered with knees on the ground and hands placed on the surface to either side, head bowed forward; facial features obscured. The figure wears a fitted long-sleeve outfit, and the wings extend outward beyond the left and right edges of the frame. The ground forms a horizontal band across the lower foreground, with a largely empty backdrop behind the wings.
  ```

  `GFX_IMP (8).txt`:

  ```
  GFX_IMPR5N. Full Body Shot Frontal of a person in a suit standing on flat ground while holding an umbrella overhead with one hand. The figure is centered with legs straight and the free arm hanging down at the side; facial features obscured by a vertical column of flames rising from the neck and upper torso area to the underside of the umbrella. The umbrella canopy sits above the head, and the handle is held at chest level. A low horizon line separates the ground plane in the lower third from an empty background.
  ```

  `GFX_IMP (9).txt`:

  ```
  GFX_IMPR5N. Wide Shot Frontal of a suspension bridge spanning across a body of water, with a small sailboat near the center foreground. Large flower clusters and leaves fill the top foreground, overlapping the upper portion of the scene. A person sits on a bridge beam in the left midground with legs dangling, holding a fishing rod angled outward; facial features not visible due to distance. The bridge towers and cables extend from left to right into the background, with rocky shoreline and hills behind the bridge, and low shrubs in the left foreground.
  ```

  `GFX_IMP (10).txt`:

  ```
  GFX_IMPR5N Medium Wide Shot Profile Left of a person standing in the right foreground on an elevated walkway, facing left over a street lined with posters and billboards. The person wears a long coat or jacket and stands behind a horizontal railing that cuts across the lower half of the frame; facial features obscured. A large poster with a screaming face is cropped along the left edge, and cars are visible on the road below in the center background.
  ```

  `GFX_IMP (11).txt`:

  ```
  GFX_IMPR5N Wide Shot Frontal of a large human head sculpture centered above a narrow stream in a dense grove of tall, thin tree trunks. The face is bald with an oval shape, soft jawline, rounded chin, prominent cheekbones, tall forehead, thin arched eyebrows, closed eyes with smooth eyelids, a straight narrow nose with a rounded tip, and medium full lips with a closed mouth; medium ears with small hoop earrings. The stream runs from the foreground toward the sculpture, with rocks and leafy plants crowding both banks in the left and right foreground.
  ```

  `GFX_IMP (12).txt`:

  ```
  GFX_IMPR5N Shoulder Up Close Up Frontal of a person centered inside a large circular frame, looking straight toward the camera. The face is oval with a soft jawline and rounded chin, moderately prominent cheekbones, a tall forehead, medium-thick eyebrows with a slight arch, almond-shaped eyes with slight hooding and average spacing, a straight narrow nose with a small rounded tip, and full lips with a defined cupid's bow and slightly parted mouth; clean-shaven with no facial hair. Short hair is swept back with a side part, and tall building facades rise behind the circular frame in the background.
  ```

  `GFX_IMP (13).txt`:

  ```
  GFX_IMPR5N Macro Close Up Frontal of an open hand held toward the camera with the palm facing forward and fingers spread. A small circular mark sits at the center of the palm with thin radiating lines around it. The wrist and lower forearm enter from the bottom edge, and small scattered flecks float around the hand against a plain background.
  ```

  `GFX_IMP (14).txt`:

  ```
  GFX_IMPR5N Medium Shot Frontal of a seated person centered in frame holding a cigarette up near the left side of their head. The person wears a suit jacket and rests the other hand on a rectangular book or notebook on their lap; facial features obscured. Two palm tree trunks frame the person on the left and right, with palm fronds hanging near the top edge and vertical architectural lines in the background.
  ```

  `GFX_IMP (15).txt`:

  ```
  GFX_IMPR5N Medium Shot Frontal of a person standing among dense flowers in the foreground with their head tilted down. The face is oval with a soft jawline, a small pointed chin, subtle cheekbones, a medium-height forehead, straight medium eyebrows, almond-shaped downcast eyes, a straight narrow nose, and medium lips with a closed mouth; no facial hair. The person has shoulder-length hair with bangs and wears a V-neck dress with a tied belt, while a flat horizon with distant trees and a circular sun sits in the background.
  ```

  `GFX_IMP (16).txt`:

  ```
  GFX_IMPR5N Medium Shot Frontal of two people riding a motorcycle directly toward the camera inside an arched tunnel. The front rider is centered gripping the handlebars, with a square face, angular jawline, pronounced chin, prominent cheekbones, strong brow ridge, thick eyebrows, deep-set almond eyes with close spacing, a straight nose with a broad bridge, and thin lips in a closed mouth; short wavy hair with a side part and no visible facial hair. The rear rider appears over the left shoulder behind them with an oval face, soft jawline, small chin, gentle cheekbones, straight thin eyebrows, downcast almond eyes, a small straight nose, and thin lips with a closed mouth; short bobbed hair with bangs. The motorcycle's round headlamp and side mirrors dominate the lower center foreground, and repeating tunnel ribs and rectangular wall panels recede into the background.
  ```

  `GFX_IMP (17).txt`:

  ```
  GFX_IMPR5N Neck Up Close Up Frontal of a person with their head tilted back and mouth wide open, showing upper and lower teeth. The face is long with a sharp jawline, pointed chin, prominent cheekbones, a medium forehead, thick eyebrows, eyes squeezed shut, a straight nose with visible nostrils from the upward tilt, and medium lips stretched around the open mouth; small freckles or spots on the cheeks and chin, and ears visible with slight protrusion. The bare neck and shoulders fill the lower frame while small debris fragments float in the background.
  ```

  `GFX_IMP (18).txt`:

  ```
  GFX_IMPR5N Wide Shot Three Quarter Rear Right of a person riding a bicycle across a suspension bridge, positioned in the left foreground and leaning forward over drop handlebars. The rider wears a jacket and backpack; facial features not visible. Bridge cables and railings form converging lines toward a tower in the far right background, with a distant skyline and roadway elements receding along the right side of the frame.
  ```

  `GFX_IMP (19).txt`:

  ```
  GFX_IMPR5N Medium Wide Shot (MWS) Profile Left of a shirtless person crouched on a rocky ledge in the right foreground with one arm extended down toward sparse tufts of ground plants. The person has a long oval face, a sharp angled jawline, a pointed chin, prominent cheekbones, a medium-height forehead, straight medium-thick eyebrows, almond-shaped eyes looking downward, a straight narrow nose bridge with a defined tip, and thin closed lips; short hair with a tousled side-swept fringe and a clean-shaven face. A large cratered moon sits in the left background above a star-filled sky, and a curved arc band crosses the upper frame from left to right above jagged rock spires in the midground.
  ```

  `GFX_IMP (20).txt`:

  ```
  GFX_IMPR5N Wide Shot (WS) Rear Facing of two people seated on separate swings in the center foreground, viewed from behind with their legs hanging down and feet pointed toward the ground. Both faces are not visible. The swing ropes run vertically up out of frame, and a bicycle and a bag rest on the ground in the left foreground near low plants and tall grass. The background shows a body of water between rocky banks and distant hills, with bare trees scattered along the shoreline and a large sun above the horizon.
  ```

  `GFX_IMP (21).txt`:

  ```
  GFX_IMPR5N Close Up (CU) Frontal of a person curled up with knees drawn to their chest, centered in frame with their head lowered toward one knee. The person has an oval face with a soft jawline, a small rounded chin, high cheekbones, a short forehead partly covered by fringe, thick straight eyebrows, hooded almond-shaped eyes looking downward, a straight narrow nose, and thin lips pressed together; short hair with a messy fringe, a visible ear, and a clean-shaven face. The person wears a long-sleeve top and pants, and the background is a close wall of vertical wooden boards with a doorway opening behind the head and shoulders.
  ```

  `GFX_IMP (22).txt`:

  ```
  GFX_IMPR5N Medium Close Up (MCU) Frontal of a person leaning out of a car window in the right foreground with their head tilted back and one arm raised above their head. The person has an oval face, a defined jawline, a pointed chin, prominent cheekbones, a medium-height forehead, thick eyebrows partly obscured, eyes obscured by large sunglasses, a straight nose with narrow nostrils, and full lips with the mouth open and upper teeth visible; short tousled hair with loose strands and no facial hair. The person wears drop earrings and wrist bracelets, and the car door frame and side mirror occupy the lower left foreground. In the left background, a street recedes between multi-story buildings with several vehicles parked along the curb.
  ```

  `GFX_IMP (23).txt`:

  ```
  GFX_IMPR5N Medium Close Up (MCU) Frontal of a person seated in the driver's seat, centered behind the steering wheel with one hand gripping the wheel in the right foreground. The person has a square face, a strong angled jawline, a broad chin, pronounced cheekbones, a tall forehead, thick straight eyebrows, deep-set almond-shaped eyes, a straight medium-width nose with a rounded tip, and medium-full lips held closed; short hair swept back and a clean-shaven face. The car interior frames the subject with the front seat back in the left foreground and the dashboard and windshield along the lower frame. Through the side windows in the background, multiple people stand outside near a wall and vertical structures.
  ```

  `GFX_IMP (24).txt`:

  ```
  GFX_IMPR5N Full Body Shot Profile Right of a person kneeling on a tiled bathroom floor in front of a freestanding bathtub, with their head resting on the tub rim and one arm draped over the edge. The person wears a short-sleeve button-up shirt, a pleated skirt, socks, and shoes, and their other hand rests on the floor near an open book; facial features obscured by hair and head angle. Notebook pages and the open book lie flat in the center foreground, with several rocks placed to the right of the book. The background includes the bathtub faucet and pipes, wall panels, a doorframe on the right, and a cable running across the floor near the tub.
  ```

  `GFX_IMP (25).txt`:

  ```
  GFX_IMPR5N Shoulder Up Close Up Frontal of a person's face framed between two curtains, centered and looking directly toward the camera. The person has a long oval face, a sharp jawline, a squared chin, prominent cheekbones, a tall forehead, very thick straight eyebrows, almond-shaped eyes with visible eyelids, slightly wide-set eye spacing, a straight narrow nose bridge with a defined tip, and medium-full lips held closed; short hair swept back with a slightly uneven hairline and a clean-shaven face. The curtains occupy the left and right foreground edges, and a patterned shirt collar and upper chest are visible at the lower frame.
  ```

  `GFX_IMP (26).txt`:

  ```
  GFX_IMPR5N Wide Shot (WS) Rear Facing of a person in a suit standing centered in the foreground with their back to the camera, facing a crowded room of seated and standing people. Faces in the crowd are not clearly visible at this distance. Tables and chairs fill the lower foreground with bottles and glassware on the left table, and multiple figures in suits line the left and right edges. A round ceiling fixture is centered above the crowd, with tall doorway openings and wall panels framing the room in the background.
  ```

  `GFX_IMP (27).txt`:

  ```
  GFX_IMPR5N Wide Shot (WS) Frontal of a roaring tiger centered in the foreground with its mouth open and teeth visible, standing among tall grasses. Two deer stand behind the tiger on the left and right midground, and a flock of birds flies across the upper background. A large eye symbol sits high in the sky above a circular sun disc, with layered clouds and a horizontal waterline behind the animals. Dense plants frame the lower left and right foreground edges.
  ```
</Accordion>

***

## Part 2: Configuration Parameters

### Training Guidelines

<AccordionGroup>
  <Accordion title="Learning Rate Adjustment">
    * Slow loss decrease: increase to `2e-4`
    * Loss oscillation: decrease to `5e-5`
    * Baseline starting point: `1e-4`
  </Accordion>

  <Accordion title="Step Count by Dataset Size">
    * Style LoRAs (10-20 images): 1200-1800 steps
    * Character LoRAs (10-15 images): 800-1200 steps
    * Medium datasets (20-40 images): 1200-2000 steps
    * Large datasets (50+ images): 2000-3000 steps
  </Accordion>

  <Accordion title="VRAM Optimization">
    * Enable `quantize: true` for 8-bit quantization
    * Reduce resolution to 512x512
    * Use `gradient_accumulation_steps: 2` for effective batch size of 2
  </Accordion>

  <Accordion title="Quality Optimization">
    * Use high-resolution training images (1024px+)
    * Write detailed, descriptive captions
    * Include variety in poses, lighting, and backgrounds
    * Monitor training duration to prevent overfitting
  </Accordion>
</AccordionGroup>

### Default Configuration

<Accordion title="View Default Config">
  ```yaml  theme={null}
  job: "extension"
  config:
    name: "my_first_lora_v1"
    process:
      - type: "diffusion_trainer"
        training_folder: "/app/ai-toolkit/output"
        device: "cuda"
        trigger_word: "TRIGGER WORD HERE"
        network:
          type: "lora"
          linear: 32
          linear_alpha: 32
          conv: 16
          conv_alpha: 16
        save:
          dtype: "bf16"
          save_every: 250
        datasets:
          - folder_path: "/path/to/images/folder"
            caption_ext: "txt"
            resolution:
              - 512
              - 768
              - 1024
        train:
          batch_size: 1
          steps: 3000
          lr: 0.0001
          optimizer: "adamw8bit"
          timestep_type: "weighted"
          content_or_style: "balanced"
        model:
          name_or_path: "black-forest-labs/FLUX.2-klein-base-9B"
          quantize: true
  meta:
    name: "[name]"
    version: "1.0"
  ```
</Accordion>

### Graphic\_Impressions Configuration

<Accordion title="View Graphic_Impressions Config">
  ```yaml  theme={null}
  job: "extension"
  config:
    name: "Graphic_Impressions_Flux2-klein-base-9b"
    process:
      - type: "diffusion_trainer"
        training_folder: "/app/ai-toolkit/output"
        device: "cuda"
        trigger_word: "GFX_IMPR5N"
        network:
          type: "lora"
          linear: 128
          linear_alpha: 64
          conv: 64
          conv_alpha: 32
        save:
          dtype: "bf16"
          save_every: 150
          max_step_saves_to_keep: 20
        datasets:
          - folder_path: "/workspace/aitoolkit/datasets/Graphic_Impressions"
            caption_ext: "txt"
            resolution:
              - 256
              - 512
              - 768
              - 1024
              - 1280
              - 1536
        train:
          batch_size: 1
          steps: 3000
          lr: 0.000095
          optimizer: "adamw8bit"
          timestep_type: "shift"
          content_or_style: "balanced"
          optimizer_params:
            weight_decay: 0.00015
        model:
          name_or_path: "black-forest-labs/FLUX.2-klein-base-9B"
          quantize: true
          low_vram: false
  meta:
    name: "[name]"
    version: "1.0"
  ```
</Accordion>

### Parameter Modifications

Here's what was changed from the defaults and why.

#### Network Dimensions: 4:2:2:1 Ratio

```
linear: 128
linear_alpha: 64
conv: 64
conv_alpha: 32
```

The larger network (approximately 500MB per model) captures low-frequency details including subtle textures, color relationships, and tonal variations.

**Smaller dimension use cases:**

* Low detail content (e.g., 2D vector logos)
* Content-focused training (compositions, high-noise characteristics)
* Training objectives focused on high-noise elements

Smaller networks prevent interference with low-noise style characteristics. Film grain training exemplifies super low-noise processing, as grain exists at the granular pixel level. Such fine texture learning requires larger network dimensions for adequate capture.

#### Style-Specific Parameter Adjustments

**Timestep Bias: `shift`**\
Encourages overfitting of low-frequency information. Textures and colors adopt more rudimentary characteristics, producing unpolished, sketch-like qualities.

**Learning Rate: `0.000095`**\
Decreased from default value. Preserves broken, gestural linework from training data rather than applying smoothing.

**Weight Decay: `0.00015`**\
Increased from default value. Simplifies shapes and colors, reducing compositional complexity and emphasizing bolder, cleaner forms.

#### Step Count Selection

The 1500-step checkpoint produced optimal results.

**Style-specific considerations:** The loose, sketch-like aesthetic required reduced training duration. Higher step counts introduced excessive realism, compromising painterly spontaneity.

Step count, configuration parameters, and target aesthetic form an interdependent system. No universal optimal configuration exists; effectiveness depends on specific training objectives.

<img src="https://cdn.sanity.io/images/2gpum2i6/production/c42d9529447c52526907e24ca4404f93b5d54391-7152x1072.png" alt="Step count comparison" style={{ borderRadius: '8px', width: '100%', marginTop: '16px', marginBottom: '8px' }} />

<p style={{ textAlign: 'center', fontSize: '0.9em', fontStyle: 'italic', color: '#666' }}>Progressive training visualization: Base model only (left) → 6000 training steps (right)</p>

***

## Part 3: Sampling Configuration

Sampling settings at inference matter just as much as training config — they need to match.

### Recommended Sampling Parameters

**Inference Steps: 8**
Significantly reduced from typical ranges (20 to 50 steps). Aligns with reduced training duration to preserve soft, painterly, impressionistic qualities.

***

## Output Examples

<CardGroup cols={2}>
  <img src="https://cdn.sanity.io/images/2gpum2i6/production/625259ed234c6937cfa5e13d412e23bdf506ce7c-1024x1024.png" alt="Output 1" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/61cc03b5aa54dd9be85a3510cae2303c78927dab-1024x1024.png" alt="Output 2" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/b6629cb9d12b7a0ed18435a45d30cba5c6c0b9b0-1024x1024.png" alt="Output 3" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/c1752e5bd05fe947fb1491bf2beebcb56fa37919-1024x1024.png" alt="Output 4" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/0277ad83ebbb7a2cdf1648fe1dd4891d2e976b8a-1024x1024.png" alt="Output 5" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/2654469d878cd431f043492959c8dd28e5b2a242-1024x1024.png" alt="Output 6" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/6944498b6e070d77180efb05fc4eacee4b5f0ec7-1024x1024.png" alt="Output 7" style={{ borderRadius: '8px' }} />

  <img src="https://cdn.sanity.io/images/2gpum2i6/production/a2ff167fc5c1efbe72f1e43bbb802e1bff83b4fc-1024x1024.png" alt="Output 8" style={{ borderRadius: '8px' }} />
</CardGroup>

***

## Adaptation Guidelines

These settings work as starting points for other styles too:

**Photo-realistic styles:**

* Training steps: 7000
* Weight decay: 0.00001
* Sampling steps: 20 to 30

**Graphic/vector styles:**

* Network dimensions: 64:32:32:16
* Dataset size: 15 to 20 images

**Experimental applications:**

* Push parameters beyond standard ranges (linear >128, weight decay >0.0002)
* Accept aesthetic degradation as intentional output characteristic

***

## Additional Resources

<CardGroup cols={2}>
  <Card title="FLUX.2 Klein Training" icon="graduation-cap" href="/flux_2/flux2_klein_training">
    Complete training documentation
  </Card>

  <Card title="Klein Prompting Guide" icon="sparkles" href="/guides/prompting_guide_flux2_klein">
    Optimal prompting strategies for Klein models
  </Card>

  <Card title="AI-Toolkit Documentation" icon="book" href="https://github.com/ostris/ai-toolkit">
    Advanced configuration options
  </Card>
</CardGroup>


Built with [Mintlify](https://mintlify.com).x