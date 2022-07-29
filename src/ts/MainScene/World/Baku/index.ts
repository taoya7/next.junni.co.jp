import * as THREE from 'three';
import * as ORE from 'ore-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PowerMesh } from 'power-mesh';

import bakuFrag from './shaders/baku.fs';
import bakuVert from './shaders/baku.vs';
import passThroughFrag from './shaders/passThrough.fs';

export type BakuMaterialType = 'normal' | 'grass' | 'line'

export class Baku extends THREE.Object3D {

	private animator: ORE.Animator;

	private manager: THREE.LoadingManager;
	private commonUniforms: ORE.Uniforms;

	private mesh?: PowerMesh;
	protected meshLine?: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

	private passThrough?: ORE.PostProcessing;

	public sceneRenderTarget: THREE.WebGLRenderTarget;

	public onLoaded?: () => void;

	constructor( manager: THREE.LoadingManager, parentUniforms: ORE.Uniforms ) {

		super();

		this.manager = manager;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uSceneTex: {
				value: null
			},
			uBackSideNormalTex: {
				value: null
			},
			winResolution: {
				value: new THREE.Vector2()
			},
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uTransparent = this.animator.add( {
			name: 'bakuTransparent',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic
		} );

		this.commonUniforms.uLine = this.animator.add( {
			name: 'bakuLine',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic
		} );

		/*-------------------------------
			RenderTarget
		-------------------------------*/

		this.sceneRenderTarget = new THREE.WebGLRenderTarget( 1, 1 );

		/*-------------------------------
			Load
		-------------------------------*/

		let loader = new GLTFLoader( this.manager );

		loader.load( './assets/scene/baku.glb', ( gltf ) => {

			let bakuWrap = gltf.scene.getObjectByName( "baku_amature" ) as THREE.Object3D;

			this.add( bakuWrap );

			/*-------------------------------
				MainMesh
			-------------------------------*/

			this.mesh = new PowerMesh( bakuWrap.getObjectByName( 'Baku' ) as THREE.Mesh, {
				fragmentShader: bakuFrag,
				vertexShader: bakuVert,
				uniforms: this.commonUniforms,
			}, true );

			this.mesh.onBeforeRender = ( renderer ) => {

				if ( ! this.passThrough ) {

					this.passThrough = new ORE.PostProcessing( renderer, {
						fragmentShader: passThroughFrag,
					} );

				}

				let currentRenderTarget = renderer.getRenderTarget();

				if ( currentRenderTarget ) {

					this.passThrough.render( { tex: currentRenderTarget.texture }, this.sceneRenderTarget );

					this.commonUniforms.uSceneTex.value = this.sceneRenderTarget.texture;

				}

			};

			/*-------------------------------
				Line Mesh
			-------------------------------*/

			const lineMat = new THREE.ShaderMaterial( {
				vertexShader: bakuVert,
				fragmentShader: bakuFrag,
				uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				} ),
				side: THREE.BackSide,
				transparent: true,
				defines: {
					IS_LINE: ''
				},
			} );

			this.meshLine = new THREE.Mesh( this.mesh.geometry, lineMat );
			this.add( this.meshLine );

			if ( this.onLoaded ) {

				this.onLoaded();

			}

		} );

	}

	public changeMaterial( type: BakuMaterialType ) {

		this.animator.animate( 'bakuTransparent', type == 'grass' ? 1 : 0, 1 );
		this.animator.animate( 'bakuLine', type == 'line' ? 1 : 0, 1 );


	}

	public resize( info: ORE.LayerInfo ) {

		this.sceneRenderTarget.setSize( info.size.canvasPixelSize.x, info.size.canvasPixelSize.y );
		this.commonUniforms.winResolution.value.copy( info.size.canvasPixelSize );

	}

}