# Falling Sand Simulation
This is a web-based simulation of falling sand with velocity, water and walls. 

## [Live Demo](https://www.inriz.com/sand/)
![Screenshot of Falling Sand Simulation](https://www.inriz.com/sand/screenshot.png)

## How to use
To run the simulation, open the index.html file in your browser. You can use the buttons on the top-left corner to select different materials: sand, water, wall or eraser. Then, click or drag on the canvas to place the material. You can also resize the window and the simulation will adjust accordingly.

## How it works
The simulation uses a grid of cells, each with a material type, a velocity and an updated flag. The main logic is in the stepSimulation function, which loops through all the cells and updates them according to their material and velocity. It uses an integer texture buffer to store the RGBA values of each cell, which is then sent to the GPU and rendered using a vertex and a fragment shader as a full-screen quad. The fragment shader adds some noise and patterns to the sand and brick lines to the walls to make them look more realistic.
