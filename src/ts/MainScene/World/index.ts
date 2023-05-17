import * as THREE from 'three';
import * as ORE from 'ore-three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Carpenter } from './Carpenter';

export class World extends THREE.Object3D {

	private gltf?: GLTF;

	private carpenter: Carpenter;

	private camera: THREE.Camera;
	private commonUniforms: ORE.Uniforms;

	constructor( camera: THREE.Camera, parentUniforms: ORE.Uniforms ) {

		super();

		this.camera = camera;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		this.carpenter = new Carpenter( this, this.camera, this.commonUniforms );

	}

	public setGltf( gltf: GLTF ) {

		this.gltf = gltf;

		this.carpenter.setGltf( this.gltf );

	}

	public update( deltaTime: number ) {
	}

	public resize( info: ORE.LayerInfo ) {
	}

	public dispose() {
	}

}
