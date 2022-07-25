import * as THREE from 'three';
import * as ORE from 'ore-three';

export type CameraTransform = {
	position: THREE.Vector3;
	targetPosition: THREE.Vector3;
}

export class CameraController {

	private animator: ORE.Animator;

	// camera

	private camera: THREE.PerspectiveCamera;
	private baseCamera: THREE.PerspectiveCamera;

	// cursor

	private cursorPos: THREE.Vector2;
	public cursorPosDelay: THREE.Vector2;
	private cursorPosDelayVel: THREE.Vector2;

	// param

	private moveRange: THREE.Vector2;

	private posData = {
		base: {
			pos: new THREE.Vector3( 0, 0, 3.49641 ),
			target: new THREE.Vector3( 0, 0, 0 )
		},
	};

	constructor( obj: THREE.PerspectiveCamera ) {

		this.camera = obj;
		this.baseCamera = new THREE.PerspectiveCamera( 45, 1.0, 0.1, 1000 );

		// param

		this.moveRange = new THREE.Vector2( 0.1, 0.1 );

		/*------------------------
			Animator
		------------------------*/
		this.animator = window.gManager.animator;

		this.animator.add( {
			name: 'cameraPos',
			initValue: this.posData.base.pos.clone(),
		} );

		this.animator.add( {
			name: 'cameraTargetPos',
			initValue: this.posData.base.target.clone(),
		} );

		this.cursorPos = new THREE.Vector2();
		this.cursorPosDelay = new THREE.Vector2();
		this.cursorPosDelayVel = new THREE.Vector2();

	}

	public updateTransform( a: CameraTransform, b:CameraTransform, t: number ) {

		this.animator.setValue( 'cameraPos', a.position.clone().lerp( b.position, t ) );
		this.animator.setValue( 'cameraTargetPos', a.targetPosition.clone().lerp( b.targetPosition, t ) );

	}

	public updateCursor( pos: THREE.Vector2 ) {

		if ( pos.x != pos.x ) return;

		this.cursorPos.set( Math.min( 1.0, Math.max( - 1.0, pos.x ) ), Math.min( 1.0, Math.max( - 1.0, pos.y ) ) );

	}

	public update( deltaTime: number ) {

		deltaTime = Math.min( 0.3, deltaTime ) * 0.3;

		/*------------------------
			update hover
		------------------------*/

		let diff = this.cursorPos.clone().sub( this.cursorPosDelay ).multiplyScalar( deltaTime * 1.0 );
		diff.multiply( diff.clone().addScalar( 1.0 ) );

		this.cursorPosDelayVel.add( diff.multiplyScalar( 3.0 ) );
		this.cursorPosDelayVel.multiplyScalar( 0.85 );

		this.cursorPosDelay.add( this.cursorPosDelayVel );

		/*------------------------
			Position
		------------------------*/

		let basePos = this.animator.get<THREE.Vector3>( 'cameraPos' ) || new THREE.Vector3();

		this.camera.position.set(
			basePos.x + this.cursorPosDelay.x * this.moveRange.x,
			basePos.y + this.cursorPosDelay.y * this.moveRange.y,
			basePos.z
		);

		/*------------------------
			Target
		------------------------*/

		this.camera.lookAt( this.animator.get<THREE.Vector3>( 'cameraTargetPos' ) || new THREE.Vector3() );

	}

	public resize( info: ORE.LayerInfo ) {

		this.camera.fov = this.baseCamera.fov * 1.0 + info.size.portraitWeight * 20.0;
		this.camera.updateProjectionMatrix();

	}

}