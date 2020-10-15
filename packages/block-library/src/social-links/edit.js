/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */

import { Fragment } from '@wordpress/element';

import {
	BlockControls,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	Dropdown,
	MenuGroup,
	MenuItem,
	PanelBody,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';

const ALLOWED_BLOCKS = [ 'core/social-link' ];

// Template contains the links that show when start.
const TEMPLATE = [
	[
		'core/social-link',
		{ service: 'wordpress', url: 'https://wordpress.org' },
	],
	[ 'core/social-link', { service: 'facebook' } ],
	[ 'core/social-link', { service: 'twitter' } ],
	[ 'core/social-link', { service: 'instagram' } ],
	[ 'core/social-link', { service: 'linkedin' } ],
	[ 'core/social-link', { service: 'youtube' } ],
];

const sizeOptions = [
	{ name: __( 'Small' ), value: 'has-small-icon-size' },
	{ name: __( 'Normal' ), value: 'has-normal-icon-size' },
	{ name: __( 'Large' ), value: 'has-large-icon-size' },
	{ name: __( 'Huge' ), value: 'has-huge-icon-size' },
];

export function SocialLinksEdit( props ) {
	const {
		attributes: { iconSize, openInNewTab },
		setAttributes,
	} = props;

	const className = classNames( iconSize );
	const blockProps = useBlockProps( { className } );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		templateLock: false,
		template: TEMPLATE,
		orientation: 'horizontal',
		__experimentalAppenderTagName: 'li',
	} );

	const openOnArrowDown = ( event ) => {
		if ( event.keyCode === DOWN ) {
			event.preventDefault();
			event.stopPropagation();
			event.target.click();
		}
	};
	return (
		<Fragment>
			<BlockControls>
				<Dropdown
					className={ 'icon-size-picker__dropdown' }
					contentClassName={ 'icon-size-picker__dropdowncontent' }
					popoverProps={ { position: 'bottom right' } }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<ToolbarGroup>
							<ToolbarButton
								onClick={ onToggle }
								onKeyDown={ openOnArrowDown }
								aria-expanded={ isOpen }
								aria-haspopup="true"
							>
								{ __( 'Size' ) }
							</ToolbarButton>
						</ToolbarGroup>
					) }
					renderContent={ () => (
						<MenuGroup label={ __( 'Icon size' ) }>
							{ sizeOptions.map( ( entry ) => {
								return (
									<MenuItem
										key={ entry.value }
										role="menuitemradio"
										isSelected={ iconSize === entry.value }
										onClick={ () =>
											setAttributes( {
												iconSize: entry.value,
											} )
										}
									>
										{ entry.name }
									</MenuItem>
								);
							} ) }
						</MenuGroup>
					) }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Open links in new tab' ) }
						checked={ openInNewTab }
						onChange={ () =>
							setAttributes( { openInNewTab: ! openInNewTab } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<ul { ...innerBlocksProps } />
		</Fragment>
	);
}

export default SocialLinksEdit;
