import EventEmitter from 'wolfy87-eventemitter';
import { BLidgeCameraParam, BLidgeLightParam, BLidgeNode } from '..';

export type BLidgerUpdateEvent = {
	deltaTime: number;
}

export class BLidger extends EventEmitter {

	private target: THREE.Object3D;
	private node: BLidgeNode;

	// transform

	private rotOffsetX: number;

	constructor( target: THREE.Object3D, node: BLidgeNode ) {

		super();

		this.target = target;
		this.node = node;

		// rot offset

		if ( this.node.type == "light" ) {

			this.rotOffsetX = - Math.PI / 2;

		} else if ( this.node.type == "camera" ) {

			this.rotOffsetX = - Math.PI / 2;

		} else {

			this.rotOffsetX = 0;

		}

		this.target.position.set( node.position.x, node.position.y, node.position.z );
		this.target.scale.set( node.scale.x, node.scale.y, node.scale.z );
		this.target.rotation.set( node.rotation.x + this.rotOffsetX, node.rotation.y, node.rotation.z, "YZX" );

		this.target.castShadow = true;
		this.target.receiveShadow = true;

		// sorezore

		if ( this.node.type == 'camera' ) {

			let target = this.target as THREE.PerspectiveCamera;
			let param = this.node.param as BLidgeCameraParam;

			if ( target.isCamera ) {

				target.fov = param.fov;

				target.updateProjectionMatrix();

			}


		} else if ( this.node.type == 'light' ) {

			let target = this.target as THREE.Light;
			let param = this.node.param as BLidgeLightParam;

			if ( target.isLight ) {

				if ( param.type == "spot" ) {

					let spot = target as THREE.SpotLight;

					if ( spot.isSpotLight ) {

						target.intensity = param.intensity / 2;

					}

				}

				target.castShadow = param.shadowMap;
				target.shadow.bias = - 0.001;

			}

		}

	}

	public update( event: BLidgerUpdateEvent ) {

		let childs = this.target.children;

		this.emit( "update", [ event ] );

		for ( let i = 0; i < childs.length; i ++ ) {

			let blidger = childs[ i ].userData.blidger;

			if ( blidger ) {

				blidger.update( event );

			}

		}

	}

}
