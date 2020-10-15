/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	BlockControls,
	__experimentalAlignmentHookSettingsProvider as AlignmentHookSettingsProvider,
} from '@wordpress/block-editor';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, useResizeObserver } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { useState, useEffect, useRef } from '@wordpress/element';
import { debounce } from 'lodash';
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';
import styles from './editor.scss';
import ContentJustificationDropdown from './content-justification-dropdown';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];

function ButtonsEdit( {
	isSelected,
	attributes,
	onDelete,
	onAddNextButton,
	shouldDelete,
	isInnerButtonSelected,
	setAttributes,
} ) {
	const { contentJustification } = attributes;
	const [ resizeObserver, sizes ] = useResizeObserver();
	const [ maxWidth, setMaxWidth ] = useState( 0 );
	const shouldRenderFooterAppender = isSelected || isInnerButtonSelected;
	const { marginLeft: spacing } = styles.spacing;

	useEffect( () => {
		const margins = 2 * styles.parent.marginRight;
		const { width } = sizes || {};
		if ( width ) {
			setMaxWidth( width - margins );
		}
	}, [ sizes ] );

	const debounceAddNextButton = debounce( onAddNextButton, 200 );

	const renderFooterAppender = useRef( () => (
		<View style={ styles.appenderContainer }>
			<InnerBlocks.ButtonBlockAppender
				isFloating={ true }
				onAddBlock={ debounceAddNextButton }
			/>
		</View>
	) );

	// Inside buttons block alignment options are not supported.
	const alignmentHooksSetting = {
		isEmbedButton: true,
	};

	function onChangeContentJustification( updatedValue ) {
		setAttributes( {
			contentJustification: updatedValue,
		} );
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarItem>
						{ ( toggleProps ) => (
							<ContentJustificationDropdown
								toggleProps={ toggleProps }
								value={ contentJustification }
								onChange={ onChangeContentJustification }
							/>
						) }
					</ToolbarItem>
				</ToolbarGroup>
			</BlockControls>
			<AlignmentHookSettingsProvider value={ alignmentHooksSetting }>
				{ resizeObserver }
				<InnerBlocks
					allowedBlocks={ ALLOWED_BLOCKS }
					template={ BUTTONS_TEMPLATE }
					renderFooterAppender={
						shouldRenderFooterAppender &&
						renderFooterAppender.current
					}
					orientation="horizontal"
					horizontalAlignment={ contentJustification }
					onDeleteBlock={ shouldDelete ? onDelete : undefined }
					onAddBlock={ debounceAddNextButton }
					parentWidth={ maxWidth }
					marginHorizontal={ spacing }
					marginVertical={ spacing }
				/>
			</AlignmentHookSettingsProvider>
		</>
	);
}

export default compose(
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockCount,
			getBlockParents,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		const selectedBlockParents = getBlockParents(
			selectedBlockClientId,
			true
		);

		return {
			// The purpose of `shouldDelete` check is giving the ability to pass to
			// mobile toolbar function called `onDelete` which removes the whole
			// `Buttons` container along with the last inner button when
			// there is exactly one button.
			shouldDelete: getBlockCount( clientId ) === 1,
			isInnerButtonSelected: selectedBlockParents[ 0 ] === clientId,
		};
	} ),
	withDispatch( ( dispatch, { clientId }, registry ) => {
		const { selectBlock, removeBlock, insertBlock } = dispatch(
			'core/block-editor'
		);
		const { getBlockOrder } = registry.select( 'core/block-editor' );

		return {
			// The purpose of `onAddNextButton` is giving the ability to automatically
			// adding `Button` inside `Buttons` block on the appender press event.
			onAddNextButton: ( selectedId ) => {
				const order = getBlockOrder( clientId );
				const selectedButtonIndex = order.findIndex(
					( i ) => i === selectedId
				);

				const index =
					selectedButtonIndex === -1
						? order.length + 1
						: selectedButtonIndex;

				const insertedBlock = createBlock( 'core/button' );

				insertBlock( insertedBlock, index, clientId );
				selectBlock( insertedBlock.clientId );
			},
			onDelete: () => {
				removeBlock( clientId );
			},
		};
	} )
)( ButtonsEdit );
