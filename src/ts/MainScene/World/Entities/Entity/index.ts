import * as THREE from 'three';
import * as ORE from 'ore-three';
import { BLidger } from '../../../BLidge/BLidger';

export type EntityOptions = {
	parentUniforms?: ORE.Uniforms,
}

export class Entity {

	protected obj: THREE.Object3D;
	protected blidger: BLidger
	protected commonUniforms: ORE.Uniforms;

	constructor( obj: THREE.Object3D, opt?: EntityOptions ) {

		this.obj = obj;

		this.blidger = obj.userData.blidger;

		if ( opt && opt.parentUniforms ) {

			this.commonUniforms = ORE.UniformsLib.mergeUniforms( opt.parentUniforms );

		} else {

			this.commonUniforms = {};

		}

	}

}
