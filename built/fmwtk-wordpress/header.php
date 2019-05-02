<?php
/**
 * The header for our theme
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package WordPress
 * @subpackage FMWTK_Wordpress
 * @since 0.0.1
 * @version 0.0.1
 */

?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="profile" href="http://gmpg.org/xfn/11">

<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
	<div id="navlogo"><?php bloginfo( 'name' ); ?></div>
	<?php wp_nav_menu( array( 'theme_location' => 'header-menu' ) ); ?>
	<?php if ( has_nav_menu( 'top' ) ) : ?>
			<?php get_template_part( 'template-parts/navigation/navigation', 'top' ); ?>
	<?php endif; ?>
