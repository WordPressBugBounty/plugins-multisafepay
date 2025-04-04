<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInit3d77fac286ad948eb03ad3e05d0efb0a
{
    public static $prefixLengthsPsr4 = array (
        'P' => 
        array (
            'Psr\\Http\\Message\\' => 17,
            'Psr\\Http\\Client\\' => 16,
        ),
        'N' => 
        array (
            'Nyholm\\Psr7\\' => 12,
        ),
        'M' => 
        array (
            'MultiSafepay\\WooCommerce\\' => 25,
            'MultiSafepay\\' => 13,
        ),
        'H' => 
        array (
            'Http\\Discovery\\' => 15,
        ),
    );

    public static $prefixDirsPsr4 = array (
        'Psr\\Http\\Message\\' => 
        array (
            0 => __DIR__ . '/..' . '/psr/http-factory/src',
            1 => __DIR__ . '/..' . '/psr/http-message/src',
        ),
        'Psr\\Http\\Client\\' => 
        array (
            0 => __DIR__ . '/..' . '/psr/http-client/src',
        ),
        'Nyholm\\Psr7\\' => 
        array (
            0 => __DIR__ . '/..' . '/nyholm/psr7/src',
        ),
        'MultiSafepay\\WooCommerce\\' => 
        array (
            0 => __DIR__ . '/../..' . '/src',
        ),
        'MultiSafepay\\' => 
        array (
            0 => __DIR__ . '/..' . '/multisafepay/php-sdk/src',
        ),
        'Http\\Discovery\\' => 
        array (
            0 => __DIR__ . '/..' . '/php-http/discovery/src',
        ),
    );

    public static $classMap = array (
        'Composer\\InstalledVersions' => __DIR__ . '/..' . '/composer/InstalledVersions.php',
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixLengthsPsr4 = ComposerStaticInit3d77fac286ad948eb03ad3e05d0efb0a::$prefixLengthsPsr4;
            $loader->prefixDirsPsr4 = ComposerStaticInit3d77fac286ad948eb03ad3e05d0efb0a::$prefixDirsPsr4;
            $loader->classMap = ComposerStaticInit3d77fac286ad948eb03ad3e05d0efb0a::$classMap;

        }, null, ClassLoader::class);
    }
}
