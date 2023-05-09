import * as THREE from 'three';

export default class AudioSphere { // Class for generating spheres made out of balls and rendering it to the scene
  meshes = [];

  constructor(radius, widthSegments, heightSegments) {
    this.radius = radius;
    this.widthSegments = widthSegments;
    this.heightSegments = heightSegments;

    this.refSphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments); // Reference geometry used to calculate positions of the balls once they have been moved and their initial positions was lost
    this.refSphere = new THREE.Mesh(this.refSphereGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));

    let positionAttributes = this.refSphereGeometry.getAttribute("position"); // Positions of vertices in the refSphere (used to calculate positions of the small balls)

    // i starts at widthSegments so we don't have duplicate positions on the top as bunch of them are at the same position there

    // Generate the small balls on positions of the vertices of the refSphere (so we get a sphere made out of small balls)
    for (let i = this.widthSegments; i < positionAttributes.count; i++) {
      const sphereGeometry = new THREE.SphereGeometry(0.2, 7, 7); // Create geometry
      const sphere = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff })); // Create mesh
    
      sphere.position.set(positionAttributes.getX(i), positionAttributes.getY(i), positionAttributes.getZ(i)); // Set the position from refSphere
      sphere.scale.set(0.1, 0.1, 0.1); // Set the scale (gets changed in the update)
      this.meshes.push(sphere); // Add the ball to meshes
    }

    // Some unused stuff :/
    this.rotation = this.refSphere.rotation;
    this.scale = this.refSphere.scale;
    this.position = this.refSphere.position;
  }

  addToScene(scene) {
    this.meshes.forEach(mesh => scene.add(mesh)); // Add each ball to the scene
  }

  update(freqData) {
    // Update positions of all meshes
    const positionAttributes = this.refSphereGeometry.getAttribute("position"); // Get the positions of reference spheres
    let freqIndex = 0;
    for (let i = this.widthSegments; i < this.meshes.length; i++) {
      let freqDataFreq = freqData[freqIndex + 20]; // I have to skip first 20 frequencies as many songs are reaching the ceiling there and that makes ugly row of balls on the top

      const sphere = this.meshes[i - this.widthSegments]; // Get the THREE ball we want to move
      const newPosition = new THREE.Vector3(positionAttributes.getX(i), positionAttributes.getY(i), positionAttributes.getZ(i));

      // Calculate new position based on frequency data
      const audioMove = (freqDataFreq**3) / 10000000;
      newPosition.multiplyScalar(audioMove + 1);
      sphere.position.set(newPosition.x, newPosition.y, newPosition.z);

      // Calculate the size
      const audioSize = freqDataFreq / 100 + 0.1;
      sphere.scale.set(audioSize, audioSize, audioSize);

      if (i % 2 == 0) { // Increase the frequency index by one every second iteration so we can have more balls :D
        freqIndex++;
      }
    }
  }
}