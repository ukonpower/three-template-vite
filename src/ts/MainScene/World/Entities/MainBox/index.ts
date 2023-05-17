import * as THREE from 'three';
import * as ORE from 'ore-three';
import { Entity, EntityOptions } from '../Entity';

export class MainBox extends Entity {

	private mesh: THREE.Mesh;

	constructor( obj: THREE.Object3D, opt?: EntityOptions ) {

		super( obj, opt );

		this.mesh = obj as THREE.Mesh;

		this.mesh.material = new THREE.MeshNormalMaterial();


	}

}
