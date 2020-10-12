/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalText as Text } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getTemplateInfo } from '../../utils';

export default function TemplateDetails( { template } ) {
	if ( ! template ) {
		return null;
	}
	const { title, description } = getTemplateInfo( template );

	return (
		<div className="edit-site-template-details">
			<p className="edit-site-template-details__heading">
				{ __( 'Template details' ) }
			</p>

			{ title && (
				<Text
					variant="body"
					className="edit-site-template-details__detail"
				>
					{ sprintf(
						/* translators: %s: Name of the template. */
						__( 'Name: %s' ),
						title
					) }
				</Text>
			) }
			{ description && (
				<Text
					variant="body"
					className="edit-site-template-details__detail"
				>
					{ sprintf(
						/* translators: %s: Description of the template. */
						__( 'Description: %s' ),
						description
					) }
				</Text>
			) }
		</div>
	);
}
