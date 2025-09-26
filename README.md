# crossy-clone
A clone of Crossy Road built with Three.js, featuring procedural terrain generation and intelligent obstacle spawning.
## Asset Creation
Three.js uses unitless measurements, so it's up to you to define what each unit represents in your project (in this case, 1 unit = 1 meter). 

When importing models, be careful - Three.js does not interpret real-world units like meters or centimeters. It only reads raw numerical values. 
For example, if your game treats 1 unit as 1 meter and you import a model designed in centimeters, a 100 cm mesh would be interpreted as 100 units in Three.js if it wasnt normalized during the export process, which would incorrectly scale it to 100 meters in this project.

If there are any issues with scaling, its always worth using a site like https://3dviewer.net/ to check the actual size of the GLTF. For this project, a cube taking up a tile would be 1.0 x 1.0 x 1.0. Some exporters will normalize cm to m, but if all else fails, set the scene units to meters. 
For this project I have used Blender 4.4 with the Khronos glTF Blender I/O v4.4.55 extension. This has correctly scaled down my model by a factor of 100.

### Handling Spawning of Modular Assets
Some assets, such as logs, are made up of modular components. This allows the logic to randomly choose a length and give a more procedural feel to world generation—as well as preventing the need to load/create multiple different models.

The initial problem with this that needed solving was: how do we make sure that each segment fits nicely together with no seams? This was done by creating a bounding box around each mesh to calculate the size, and then using this to calculate the exact mesh dimensions while creating the asset group. This worked...until the next problem came up.

The terrain system needed to know the exact length of each asset group in order to prevent them from overlapping. This information wasn't known until the end of the async function once each part had been loaded and checked.

To solve this, I looked at how a lot of engines handle this — by precomputing bounding boxes or spheres during import, and then storing this in metadata. This way, all the information would be available at runtime, without the need to measure on the fly; also giving us a small performance boost!

As we can't *import* an asset like a game engine, I repurposed the logic originally created into a utility function that we can pass an asset path into. This way we can easily get values to manually add to our config file whenever we add/update a model!

### Spawning these assets
To spawn assets, we make use of a SpawnManager class, which spawns the asset, then calculates its dimensions and sets its X position with the new value. This makes sure that assets don't overlap, and we can control distribution of assets such as trees.

Due to the fact that we load models asynchronously and this is a single-threaded execution model, we can guarantee that the updated X is always set before the model is loaded, as async functions are queued and run later, after the synchronous code has completed.

Even on a multithreaded workload, due to the simplicity of the spawn logic, this would almost always complete before the async — however, we have implemented safeguards to handle unlikely edge cases!

Here is a quick overview of the pipeline:
```
Time: 0ms                    200ms                    400ms
      |                        |                        |
      ▼                        ▼                        ▼
   Create entity           Calculate finalX         Model loads
   (x=0 initially)         entity.x = finalX        Uses correct x
   Start async loading     (x now = finalX)         Add to scene
   Continue code...        Continue code...         at finalX position
```