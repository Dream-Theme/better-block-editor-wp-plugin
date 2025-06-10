import { forwardRef } from '@wordpress/element';

export const DtCrRefAnchor = forwardRef( ( props, ref ) => {
	return <div className="dt-cr-ref-anchor" ref={ ref } { ...props }></div>;
} );
