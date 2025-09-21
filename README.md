# crossy-clone
A clone of Crossy Road

## Asset Creation
Three.js uses unitless measurements, so it's up to you to define what each unit represents in your project (in this case, 1 unit = 1 meter). 
When importing models, be careful - Three.js does not interpret real-world units like meters or centimeters. It only reads raw numerical values. 
For example, if your game treats 1 unit as 1 meter and you import a model designed in centimeters, a 100 cm mesh would be interpreted as 100 units in Three.js if it wasnt normalized during the export process, which would incorrectly scale it to 100 meters in this project.

If there are any issues with scaling, its always worth using a site like https://3dviewer.net/ to check the actual size of the GLTF. For this project, a cube taking up a tile would be 1.0 x 1.0 x 1.0. Some exporters will normalize cm to m, but if all else fails, set the scene units to meters. 
For this project I have used Blender 4.4 with the Khronos glTF Blender I/O v4.4.55 extension. This has correctly scaled down my model by a factor of 100.