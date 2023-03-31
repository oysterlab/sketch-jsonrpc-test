import react from 'react'
import { ViewProps } from 'sketch-renderer'
import { GroupProps } from 'sketch-renderer'
import { ImageProps } from 'sketch-renderer'
import { SvgProps } from 'sketch-renderer'
import { TextProps } from 'sketch-renderer'

declare global {
	namespace JSX {
		interface IntrinsicElements {
			'prism-view': ViewProps,
			'prism-group': GroupProps,			
			'prism-image': ImageProps,		
			'prism-svg': SvgProps,	
			'prism-text': TextProps,						
		}
	}
}