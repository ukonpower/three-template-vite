import * as THREE from 'three';
import * as ORE from 'ore-three';
import * as GLP from 'glpower';

import { BLidge, BLidgeNode } from '../../BLidge';
import { BLidger } from '../../BLidge/BLidger';
import SceneData from './scene/scene.json';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Factory } from '../Entities/Factory';

export class Carpenter extends GLP.EventEmitter {

	private blidge: BLidge;

	private root: THREE.Object3D;
	private camera: THREE.Camera;
	private gltf?: GLTF;

	private blidgeRoot: THREE.Object3D | null;
	private entities: Map<string, THREE.Object3D>;

	// frame

	private playing: boolean;
	private playTime: number;

	// factory

	private factory: Factory;

	constructor( root: THREE.Object3D, camera: THREE.Camera, parentUniforms: ORE.Uniforms, gltf?: GLTF ) {

		super();

		this.blidge = window.glCanvas.gManager.blidge;

		this.root = root;
		this.gltf = gltf;
		this.entities = new Map();

		this.camera = camera;

		// state

		this.playing = false;
		this.playTime = 0;

		// blidge

		this.blidgeRoot = null;

		this.blidge.on( 'sync/scene', this.onSyncScene.bind( this ) );

		this.blidge.on( 'sync/timeline', ( frame: GLP.BLidgeSceneFrame ) => {
		} );

		if ( process.env.NODE_ENV == "development" ) {

			this.blidge.connect( 'ws://localhost:3100' );

			this.blidge.on( 'error', () => {

				this.blidge.loadScene( SceneData as any );

			} );

		} else {

			this.blidge.loadScene( SceneData as any );

		}

		// factory

		this.factory = new Factory( parentUniforms );

	}

	public setGltf( gltf: GLTF ) {

		this.gltf = gltf;

		this.clearAll();

		this.onSyncScene( this.blidge );

	}

	private onSyncScene( blidge: BLidge ) {

		const timeStamp = new Date().getTime();

		const _ = ( node: BLidgeNode ): THREE.Object3D => {

			let gltfName = node.name.replace( '.', '' );

			const obj: THREE.Object3D = node.type == 'camera' ? this.camera : ( this.entities.get( node.name ) || ( this.gltf && this.gltf.scene.getObjectByName( gltfName ) ) || new THREE.Object3D() );

			if ( obj ) {

				const blidger = obj.userData.blidger;

				if ( blidger && node.type != blidger.node.type ) {
				}

			}

			obj.userData.blidger = new BLidger( obj, node );

			obj.userData.entity = this.factory.router( obj, node );

			node.children.forEach( c => {

				const child = _( c );

				obj.add( child );

			} );

			this.entities.set( node.name, obj );

			obj.userData.updateTime = timeStamp;

			return obj;

		};

		const newBLidgeRoot = blidge.root && _( blidge.root );

		if ( newBLidgeRoot ) {

			if ( this.blidgeRoot ) {

				this.root.remove( this.blidgeRoot );

			}

			this.blidgeRoot = newBLidgeRoot;

			this.root.add( this.blidgeRoot );

		}

		// remove

		this.entities.forEach( item => {

			if ( item.userData.updateTime != timeStamp ) {

				const parent = item.parent;

				if ( parent ) {

					parent.remove( item );

				}

				this.entities.delete( item.name );

			}

		} );

	}

	private clearAll() {

		this.entities.forEach( ( item, name ) => {

			const parent = item.parent;

			if ( parent ) {

				parent.remove( item );

			}

			this.entities.delete( name );


		} );

	}

}
