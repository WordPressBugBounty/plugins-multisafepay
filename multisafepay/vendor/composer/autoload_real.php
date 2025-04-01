<?php

// autoload_real.php @generated by Composer

class ComposerAutoloaderInitfc747c01d40037aa479fdf4a8e9aedcf
{
    private static $loader;

    public static function loadClassLoader($class)
    {
        if ('Composer\Autoload\ClassLoader' === $class) {
            require __DIR__ . '/ClassLoader.php';
        }
    }

    /**
     * @return \Composer\Autoload\ClassLoader
     */
    public static function getLoader()
    {
        if (null !== self::$loader) {
            return self::$loader;
        }

        require __DIR__ . '/platform_check.php';

        spl_autoload_register(array('ComposerAutoloaderInitfc747c01d40037aa479fdf4a8e9aedcf', 'loadClassLoader'), true, true);
        self::$loader = $loader = new \Composer\Autoload\ClassLoader(\dirname(__DIR__));
        spl_autoload_unregister(array('ComposerAutoloaderInitfc747c01d40037aa479fdf4a8e9aedcf', 'loadClassLoader'));

        require __DIR__ . '/autoload_static.php';
        call_user_func(\Composer\Autoload\ComposerStaticInitfc747c01d40037aa479fdf4a8e9aedcf::getInitializer($loader));

        $loader->register(true);

        return $loader;
    }
}
