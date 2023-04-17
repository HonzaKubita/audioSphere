import * as THREE from 'three';

export default class AudioSphere {
  meshes = [];

  constructor(radius, widthSegments, heightSegments) {
    this.radius = radius;
    this.widthSegments = widthSegments;
    this.heightSegments = heightSegments;

    this.refSphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    this.refSphere = new THREE.Mesh(this.refSphereGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));

    let positionAttributes = this.refSphereGeometry.getAttribute("position");

    // i starts at widthSegments so we don't have duplicate positions on the top
    for (let i = this.widthSegments; i < positionAttributes.count; i++) {
      const sphereGeometry = new THREE.SphereGeometry(0.2, 7, 7);
      const sphere = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    
      sphere.position.set(positionAttributes.getX(i), positionAttributes.getY(i), positionAttributes.getZ(i));
      sphere.scale.set(0.1, 0.1, 0.1);
      this.meshes.push(sphere);
    }

    this.rotation = this.refSphere.rotation;
    this.scale = this.refSphere.scale;
    this.position = this.refSphere.position;
  }

  addToScene(scene) {
    this.meshes.forEach(mesh => scene.add(mesh));
  }

  update(freqData) {
    // Update positions of all meshes
    const positionAttributes = this.refSphereGeometry.getAttribute("position");
    for (let i = this.widthSegments; i < this.meshes.length; i++) {
      const sphere = this.meshes[i - this.widthSegments];
      const newPosition = new THREE.Vector3(positionAttributes.getX(i), positionAttributes.getY(i), positionAttributes.getZ(i));

      // Calculate new position based on frequency data
      const audioMove = (freqData[i]**3) / 10000000;
      newPosition.multiplyScalar(audioMove + 1);
      sphere.position.set(newPosition.x, newPosition.y, newPosition.z);

      // Calculate the size
      const audioSize = freqData[i] / 100 + 0.1;
      sphere.scale.set(audioSize, audioSize, audioSize);
    }
  }
}