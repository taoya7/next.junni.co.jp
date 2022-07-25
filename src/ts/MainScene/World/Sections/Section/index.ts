import * as THREE from 'three';
import * as ORE from 'ore-three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CameraTransform } from '../../../CameraController';


export class Section extends THREE.Object3D {

	private sectionName: string;

	private commonUniforms: ORE.Uniforms;

	public cameraTransform: CameraTransform = {
		position: new THREE.Vector3(),
		targetPosition: new THREE.Vector3()
	};

	constructor( sectionName: string, parentUniforms: ORE.Uniforms ) {

		super();

		this.sectionName = sectionName;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		this.loadGLTF( this.sectionName );

	}

	private loadGLTF( gltfName: string ) {

		let loader = new GLTFLoader();

		loader.load( './assets/scene/' + gltfName + '.glb', ( gltf ) => {

			this.onLoadedGLTF( gltf );

			// camera transform

			let camera = gltf.scene.getObjectByName( 'Camera' );

			if ( camera ) {

				this.cameraTransform.position.copy( camera.position );

			}

			let target = gltf.scene.getObjectByName( 'CameraTarget' );

			if ( target ) {

				this.cameraTransform.targetPosition.copy( target.position );

			}

			// emitevent

			this.dispatchEvent( { type: 'loaded' } );

		} );

	}

	protected onLoadedGLTF( gltf: GLTF ) {

	}

}