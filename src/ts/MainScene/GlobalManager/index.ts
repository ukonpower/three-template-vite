import { Pane } from 'tweakpane';
import { AssetManager } from './AssetManager';
import { EasyRaycaster } from './EasyRaycaster';
import * as ORE from 'ore-three';


export class GlobalManager {

	public eRay: EasyRaycaster;
	public assetManager: AssetManager;
	public animator: ORE.Animator;

	private pane: Pane;

	constructor( ) {

		window.gManager = this;

		this.eRay = new EasyRaycaster();

		this.assetManager = new AssetManager();

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = new ORE.Animator();

		// pane

		this.pane = new Pane();
		this.pane.hidden = true;

		this.animator.addEventListener( 'added', ( e ) => {

			const opt = e.variable.userData && e.variable.userData.pane;

			const variable = this.animator.dataBase[ e.varName ];

			if ( ! Array.isArray( variable ) && opt ) {

				this.pane.addInput( this.animator.dataBase, e.varName, opt );

			}

		} );

		window.addEventListener( 'keydown', ( e ) => {

			if ( e.key == 'n' ) {

				this.pane.hidden = ! this.pane.hidden;

			}

		} );

	}

	public update( deltaTime: number ) {

		this.animator.update( deltaTime );

		this.pane.refresh();

	}

}

