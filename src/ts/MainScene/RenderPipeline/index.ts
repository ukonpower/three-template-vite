import * as THREE from 'three';
import { MipmapGeometry } from './MipMapGeometry';

import fxaaFrag from './shaders/fxaa.fs';
import bloomBlurFrag from './shaders/bloomBlur.fs';
import bloomBrightFrag from './shaders/bloomBright.fs';
import lightShaftFrag from './shaders/lightShaft.fs';
import ssrFrag from './shaders/ssr.fs';
import dofCoc from './shaders/dofCoc.fs';
import dofComposite from './shaders/dofComposite.fs';
import dofBokeh from './shaders/dofBokeh.fs';
import ssCompositeFrag from './shaders/ssComposite.fs';
import compositeFrag from './shaders/composite.fs';

//composite shader
import * as ORE from 'ore-three';

export type PPParam = {
	bloomBrightness?: number,
	vignet?: number,
}

export class RenderPipeline {

	private renderer: THREE.WebGLRenderer;

	private commonUniforms: ORE.Uniforms;

	private postProcess: ORE.PostProcess;

	private rt1: THREE.WebGLRenderTarget;
	private rt2: THREE.WebGLRenderTarget;
	private rt3: THREE.WebGLRenderTarget;

	private fxaa: ORE.PostProcessPass;

	private bloomRenderCount: number;
	private bloomBright: ORE.PostProcessPass;
	private bloomBlur: ORE.PostProcessPass[];
	private rtBloomVertical: THREE.WebGLRenderTarget[];
	private rtBloomHorizontal: THREE.WebGLRenderTarget[];

	private resolution :THREE.Vector2
	private resolutionInv :THREE.Vector2
	private resolutionBloom :THREE.Vector2[]

	// public dofCoc: ORE.PostProcessPass;
	// public dofBokeh: ORE.PostProcessPass;
	// public dofComposite: ORE.PostProcessPass;
	// public rtDofCoc: THREE.WebGLRenderTarget;
	// public rtDofBokeh: THREE.WebGLRenderTarget;
	// public rtDofComposite: THREE.WebGLRenderTarget;

	private composite: ORE.PostProcessPass;

	constructor( renderer: THREE.WebGLRenderer, parentUniforms: ORE.Uniforms ) {

		this.renderer = renderer;

		// resolution

		this.resolution = new THREE.Vector2();
		this.resolutionInv = new THREE.Vector2();
		this.resolutionBloom = [];

		// rt

		this.rt1 = new THREE.WebGLRenderTarget( 1, 1 );
		this.rt2 = new THREE.WebGLRenderTarget( 1, 1 );
		this.rt3 = new THREE.WebGLRenderTarget( 1, 1 );

		// uniforms

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uResolution: {
				value: this.resolution
			},
			uResolutionInv: {
				value: this.resolutionInv
			}
		} );

		// fxaa

		this.fxaa = new ORE.PostProcessPass( {
			input: [ this.rt1.texture ],
			fragmentShader: fxaaFrag,
			uniforms: this.commonUniforms,
			renderTarget: this.rt2
		} );

		// bloom

		this.bloomRenderCount = 4;

		this.rtBloomVertical = [];
		this.rtBloomHorizontal = [];

		for ( let i = 0; i < this.bloomRenderCount; i ++ ) {

			this.rtBloomVertical.push( new THREE.WebGLRenderTarget( 1, 1 ) );
			this.rtBloomHorizontal.push( new THREE.WebGLRenderTarget( 1, 1 ) );

		}

		this.bloomBright = new ORE.PostProcessPass( {
			input: [ this.rt2.texture ],
			fragmentShader: bloomBrightFrag,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				threshold: {
					value: 0.5,
				},
			} ),
			renderTarget: this.rt3
		} );

		this.bloomBlur = [];

		// bloom blur

		let bloomInput: THREE.Texture[] = [ this.rt3.texture ];

		for ( let i = 0; i < this.bloomRenderCount; i ++ ) {

			const rtVertical = this.rtBloomVertical[ i ];
			const rtHorizonal = this.rtBloomHorizontal[ i ];

			const resolution = new THREE.Vector2();
			this.resolutionBloom.push( resolution );

			this.bloomBlur.push( new ORE.PostProcessPass( {
				input: bloomInput,
				renderTarget: rtVertical,
				fragmentShader: bloomBlurFrag,
				uniforms: {
					uIsVertical: {
						value: true
					},
					uWeights: {
						value: this.guassWeight( this.bloomRenderCount )
					},
					uResolution: {
						value: resolution,
					}
				},
				defines: {
					GAUSS_WEIGHTS: this.bloomRenderCount.toString()
				}
			} ) );

			this.bloomBlur.push( new ORE.PostProcessPass( {
				input: [ rtVertical.texture ],
				renderTarget: rtHorizonal,
				fragmentShader: bloomBlurFrag,
				uniforms: {
					uIsVertical: {
						value: false
					},
					uWeights: {
						value: this.guassWeight( this.bloomRenderCount )
					},
					uResolution: {
						value: resolution,
					}
				},
				defines: {
					GAUSS_WEIGHTS: this.bloomRenderCount.toString()
				}
			} ) );

			bloomInput = [ rtHorizonal.texture ];

		}

		// composite

		this.composite = new ORE.PostProcessPass( {
			input: [ this.rt2.texture ],
			fragmentShader: compositeFrag,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				uBloomTexture: {
					value: this.rtBloomHorizontal.map( rt => rt.texture ),
				},
			} ),
			defines: {
				BLOOM_COUNT: this.bloomRenderCount.toString()
			},
			renderTarget: null
		} );

		this.postProcess = new ORE.PostProcess( {
			renderer: this.renderer,
			passes: [
				this.fxaa,
				this.bloomBright,
				...this.bloomBlur,
				this.composite,
			] } );


	}

	private guassWeight( num: number ) {

		const weight = new Array( num );

		// https://wgld.org/d/webgl/w057.html

		let t = 0.0;
		const d = 100;

		for ( let i = 0; i < weight.length; i ++ ) {

			const r = 1.0 + 2.0 * i;
			let w = Math.exp( - 0.5 * ( r * r ) / d );
			weight[ i ] = w;

			if ( i > 0 ) {

				w *= 2.0;

			}

			t += w;

		}

		for ( let i = 0; i < weight.length; i ++ ) {

			weight[ i ] /= t;

		}

		return weight;

	}

	public render( scene: THREE.Scene, camera: THREE.Camera ) {

		let rt = this.renderer.getRenderTarget();

		this.renderer.setRenderTarget( this.rt1 );
		this.renderer.render( scene, camera );

		this.postProcess.render();

		this.renderer.setRenderTarget( rt );

	}

	public resize( info: ORE.LayerInfo ) {

		this.resolution.copy( info.size.canvasPixelSize.clone() );
		this.resolutionInv.set( 1.0 / this.resolution.x, 1.0 / this.resolution.y );

		const resolutionHalf = this.resolution.clone().divideScalar( 2 );
		resolutionHalf.x = Math.max( Math.floor( resolutionHalf.x ), 1.0 );
		resolutionHalf.y = Math.max( Math.floor( resolutionHalf.y ), 1.0 );

		this.rt1.setSize( this.resolution.x, this.resolution.y );
		this.rt2.setSize( this.resolution.x, this.resolution.y );
		this.rt3.setSize( this.resolution.x, this.resolution.y );

		let scale = 2;

		for ( let i = 0; i < this.bloomRenderCount; i ++ ) {

			this.resolutionBloom[ i ].copy( this.resolution ).multiplyScalar( 1.0 / scale );

			this.rtBloomHorizontal[ i ].setSize( this.resolutionBloom[ i ].x, this.resolutionBloom[ i ].y );
			this.rtBloomVertical[ i ].setSize( this.resolutionBloom[ i ].x, this.resolutionBloom[ i ].y );

			scale *= 2.0;

		}

		// this.rtLightShaft1.setSize( this.resolution );
		// this.rtLightShaft2.setSize( this.resolution );

		// this.rtSSR1.setSize( resolutionHalf );
		// this.rtSSR2.setSize( resolutionHalf );

		// this.rtDofCoc.setSize( resolutionHalf );
		// this.rtDofBokeh.setSize( resolutionHalf );
		// this.rtDofComposite.setSize( resolution );


	}


}
