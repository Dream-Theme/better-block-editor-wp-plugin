// to detect window scroll use sentinel + IntersectionObserver

// create top sentinel dynamically (1x1 pixel) and append to body (very first element)
export function createTopSentinel() {
	const sentinel = document.createElement( 'div' );
	sentinel.classList.add( 'dt-cr-sentinel' );

	const styleSettings = {
		position: 'absolute',
		top: '0',
		left: '0',
		width: '1px',
		height: '1px',
		pointerEvents: 'none',
		visibility: 'hidden',
	};

	for ( const [ key, value ] of Object.entries( styleSettings ) ) {
		sentinel.style[ key ] = value;
	}

	return sentinel;
}

export function createSentinelObserver( observerRoot, callback ) {
	return new IntersectionObserver(
		( entries ) => entries.forEach( ( entry ) => callback( entry ) ),
		{
			root: observerRoot,
			rootMargin: '0px 0px 0px 0px',
			threshold: [ 1 ],
		}
	);
}
