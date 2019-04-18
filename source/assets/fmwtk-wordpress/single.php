<?php
/**
 * The template for displaying all single posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
 *
 * @package WordPress
 * @subpackage Twenty_Seventeen
 * @since 1.0
 * @version 1.0
 */

get_header(); ?>
			<?php
			/* Start the Loop */
			while ( have_posts() ) : the_post();
				get_template_part( 'template-parts/post/content', get_post_format() );

				the_post_navigation( array(
					'prev_text' => '<span class="screen-reader-text">' . __( 'Previous Post', 'fmwtkwordpress' ) . '</span><span aria-hidden="true" class="nav-subtitle">' . __( 'Previous', 'fmwtkwordpress' ) . '</span> <span class="nav-title"><span class="nav-title-icon-wrapper">' . fmwtkwordpress_get_svg( array( 'icon' => 'arrow-left' ) ) . '</span>%title</span>',
					'next_text' => '<span class="screen-reader-text">' . __( 'Next Post', 'fmwtkwordpress' ) . '</span><span aria-hidden="true" class="nav-subtitle">' . __( 'Next', 'fmwtkwordpress' ) . '</span> <span class="nav-title">%title<span class="nav-title-icon-wrapper">' . fmwtkwordpress_get_svg( array( 'icon' => 'arrow-right' ) ) . '</span></span>',
				) );

			endwhile; // End of the loop.
			?>


<?php get_footer();
