/**
 * External dependencies
 */
import { get, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import {
	Button,
	PanelBody,
	Placeholder,
	ToolbarGroup,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import {
	BlockIcon,
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import { brush, update } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import LegacyWidgetEditHandler from './handler';
import WidgetSelectControl from './widget-select-control';
import WidgetPreview from './widget-preview';

function LegacyWidgetEdit( {
	attributes,
	availableLegacyWidgets,
	isDuplicateReferenceWidget,
	hasPermissionsToManageWidgets,
	prerenderedEditForm,
	setAttributes,
	widgetId,
	WPWidget,
	widgetAreaId,
} ) {
	const [ hasEditForm, setHasEditForm ] = useState( true );
	const [ isPreview, setIsPreview ] = useState( false );
	const shouldHidePreview = ! isPreview && hasEditForm;

	const onResetWidget = useCallback( () => {
		setIsPreview( false );

		setAttributes( {
			instance: {},
			id: undefined,
			referenceWidgetName: undefined,
			widgetClass: undefined,
		} );
		setHasEditForm( true );
	} );

	if ( ! WPWidget ) {
		if ( ! hasPermissionsToManageWidgets ) {
			return (
				<Placeholder label={ __( 'Legacy Widget' ) }>
					{ __(
						"You don't have permissions to use widgets on this site."
					) }
				</Placeholder>
			);
		}

		return (
			<Placeholder
				icon={ <BlockIcon icon={ brush } /> }
				label={ __( 'Legacy Widget' ) }
			>
				<WidgetSelectControl
					availableLegacyWidgets={ availableLegacyWidgets }
					onChange={ setAttributes }
				/>
			</Placeholder>
		);
	}

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ WPWidget.name }>
				{ WPWidget.description }
			</PanelBody>
		</InspectorControls>
	);

	if ( ! hasPermissionsToManageWidgets ) {
		return (
			<>
				{ inspectorControls }
				<WidgetPreview
					className="wp-block-legacy-widget__preview"
					widgetAreaId={ widgetAreaId }
					attributes={ omit( attributes, 'widgetId' ) }
				/>
			</>
		);
	}

	if ( isDuplicateReferenceWidget ) {
		return (
			<Placeholder
				icon={ <BlockIcon icon={ brush } /> }
				label={ __( 'Duplicate Widget' ) }
			>
				<div>
					{ sprintf(
						// translators: %s: widget code e.g: "marquee_greeting".
						__( 'Only one instance of the "%s" widget may exist.' ),
						attributes.referenceWidgetName
					) }
				</div>
				<WidgetSelectControl
					availableLegacyWidgets={ availableLegacyWidgets }
					onChange={ setAttributes }
					emptyLabel=""
					label={ __( 'Select a different widget to display:' ) }
				/>
			</Placeholder>
		);
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{ WPWidget && ! WPWidget.isHidden && (
						<Button
							onClick={ onResetWidget }
							label={ __( 'Change widget' ) }
							icon={ update }
						/>
					) }
					{ hasEditForm && (
						<>
							<Button
								className="components-tab-button"
								isPressed={ ! isPreview }
								onClick={ () => setIsPreview( false ) }
							>
								<span>{ __( 'Edit' ) }</span>
							</Button>
							<Button
								className="components-tab-button"
								isPressed={ isPreview }
								onClick={ () => setIsPreview( true ) }
							>
								<span>{ __( 'Preview' ) }</span>
							</Button>
						</>
					) }
				</ToolbarGroup>
			</BlockControls>
			{ inspectorControls }
			{ hasEditForm && (
				<LegacyWidgetEditHandler
					isVisible={ ! isPreview }
					id={ widgetId }
					idBase={ attributes.idBase || widgetId }
					number={ attributes.number }
					prerenderedEditForm={ prerenderedEditForm }
					widgetName={ get( WPWidget, [ 'name' ] ) }
					widgetClass={ attributes.widgetClass }
					instance={ attributes.instance }
					onFormMount={ ( formData ) => {
						// Function-based widgets don't come with an object of settings, only
						// with a pre-rendered HTML form. Extracting settings from that HTML
						// before this stage is not trivial (think embedded <script>). An alternative
						// proposed here serializes the form back into widget settings immediately after
						// it's mounted.
						if ( ! attributes.widgetClass ) {
							setAttributes( {
								instance: formData,
							} );
						}
					} }
					onInstanceChange={ ( newInstance, newHasEditForm ) => {
						if ( newInstance ) {
							setAttributes( {
								instance: newInstance,
							} );
						}
						setHasEditForm( newHasEditForm );
					} }
				/>
			) }
			{ WPWidget?.isReferenceWidget ? (
				<p hidden={ shouldHidePreview }>
					{ __( 'Reference widgets cannot be previewed.' ) }
				</p>
			) : (
				<WidgetPreview
					hidden={ shouldHidePreview }
					className="wp-block-legacy-widget__preview"
					widgetAreaId={ widgetAreaId }
					attributes={ omit( attributes, 'widgetId' ) }
				/>
			) }
		</>
	);
}

export default withSelect( ( select, { clientId, attributes } ) => {
	const { widgetClass, referenceWidgetName } = attributes;
	let widgetId = select( 'core/edit-widgets' ).getWidgetIdForClientId(
		clientId
	);
	const widget = select( 'core/edit-widgets' ).getWidget( widgetId );
	const widgetArea = select( 'core/edit-widgets' ).getWidgetAreaForClientId(
		clientId
	);
	const editorSettings = select( 'core/block-editor' ).getSettings();
	const {
		availableLegacyWidgets,
		hasPermissionsToManageWidgets,
	} = editorSettings;

	let WPWidget;
	if ( widgetId && availableLegacyWidgets[ widgetId ] ) {
		WPWidget = availableLegacyWidgets[ widgetId ];
	} else if ( widgetClass && availableLegacyWidgets[ widgetClass ] ) {
		WPWidget = availableLegacyWidgets[ widgetClass ];
	} else if ( referenceWidgetName ) {
		WPWidget = availableLegacyWidgets[ referenceWidgetName ];
		widgetId = referenceWidgetName;
	}

	let isDuplicateReferenceWidget = false;
	if ( referenceWidgetName ) {
		const referenceWidgetBlocks = select(
			'core/edit-widgets'
		).getReferenceWidgetBlocks( referenceWidgetName );
		if ( clientId !== referenceWidgetBlocks[ 0 ].clientId ) {
			isDuplicateReferenceWidget = true;
		}
	}

	return {
		hasPermissionsToManageWidgets,
		isDuplicateReferenceWidget,
		availableLegacyWidgets,
		widgetId,
		widgetAreaId: widgetArea?.id,
		WPWidget,
		prerenderedEditForm: widget ? widget.rendered_form : '',
	};
} )( LegacyWidgetEdit );
