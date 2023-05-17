import * as THREE from 'three';
import * as ORE from 'ore-three';
import EventEmitter from 'wolfy87-eventemitter';
import { BLidgeNode } from '../../BLidge';
import { MainBox } from './MainBox';
import { Entity } from './Entity';

export class Factory extends EventEmitter {

	private commonUniforms: ORE.Uniforms;

	constructor( parentUniforms: ORE.Uniforms ) {

		super();

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

	}

	public router( obj: THREE.Object3D, node: BLidgeNode ) {

		if ( obj.name == 'MainBox' ) {

			return new MainBox( obj );

		}

		return new Entity( obj );

	}

}
