<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/6306796/26037402/2d80aa16-38f2-11e7-8bba-72e956921eb2.png">
  <p align="center">npm scripts on steroids!</p>
</p>

[![npm version](https://badge.fury.io/js/makfy.svg)](https://badge.fury.io/js/makfy)


Install it globally ```npm install -g makfy```  
or locally ```npm install --save-dev makfy``` 

__To support this project star it on [github](https://github.com/xaviergonz/makfy)!__

## What is makfy?

makfy is an evolution of npm-scripts to help you automate time-consuming tasks in your development workflow.

## Why makfy?
Build systems should be simple, and that's why we guess npm scripts are gaining traction lately.  
makfy tries to follow that KISS philosophy while adapting gracefully to complex build requirements.
  
#### What does it inherit from npm scripts?

* It is still **shell-based** in its core.

* The gazillion CLI tools available in npm (*browserify, rimraf, webpack...*) are still available for you to use.    
  In other words, if there's a CLI version of it available nothing else is needed to use it with makfy.

#### What does it add?
* **Javascript powered**  
  ```makfyfile.js``` is a javascript file, so you can use it to decide how the shell commands should run or when.
  
* **Easy argument definition**  
  It is easy to create command line arguments for each command, plus validation is made automatically.
  
* **Command line help auto-generation**  
  So you don't have to dig into config files to know what each command does.

* **Concurrency made easy**  
  Thanks to async/await plus some nifty tricks (and concurrent logs look good!).
  
* **Utils included, such as a smart cache!**  
  For example it includes a file checker so shell commands are not run twice if not needed, or only run on the files that changed.
  
* **Strong validation of ```makfyfile.js``` files**  
  You should not be left wondering if you mistyped something.
  
* **Colorized detailed logs**  
  So it is easy to spot where your build is currently at and/or where it failed.


## Sample ```makfyfile.js``` files

A simple example (run with ```makfy clean```).

**Note:** To use the async/await syntax you must install **node 7.6+**; if you can't then you can either use promises (though the syntax won't be as nice) or babelize/typescript compile the ```makfyfile.js``` file.

```js
module.exports = {
  commands: {
    clean: {
      run: async(exec) => {
        await exec(
          // running sequentially
          'rimraf ./dist-a',
          'rimraf ./dist-b',
          // and these run after the other ones too, but in parallel!
          [ 'rimraf ./dist-c', 'rimraf ./dist-d' ]
        );
      }
    }
  }  
};
```

Another one but with arguments and help (run with ```makfy clean --dev```, ```makfy clean --prod``` or ```makfy clean --dev --prod```).
```js
module.exports = {
  commands: {
    clean: {
      desc: 'clean the project',
      args: {
        prod: { type: 'flag', desc: 'production clean' },
        dev: { type: 'flag', desc: 'dev clean' }
      },
      run: async(exec, args) => {
        await exec(
          args.prod ? 'rimraf ./dist-prod' : null,
          args.dev ? 'rimraf ./dist-dev' : null
        );
      }
    }
  }  
};
```

The help we will get when running ```makfy --list```.
```
using command file 'makfyfile.js'...
listing all commands...

clean [--dev] [--prod]
 - clean the project
   [--dev]     dev clean (default: false)
   [--prod]    production clean (default: false)

```

Running commands inside commands (```makfy build```).
```js
module.exports = {
  commands: {
    build: {
      run: async(exec) => {
        await exec(
          '@clean',
          { _: 'clean' }, // same as above
          ... // whatever commands go next
        );        
      }
    }
    clean: {
      ...
    }
  }  
};
```

Running commands inside commands and sending them arguments.
```js
module.exports = {
  commands: {
    build: {
      run: async(exec) => {
        await exec(
          '@clean --dev --prod',
          { _: 'clean', args: { dev: true, prod: true }}, // same as above          
          ... // whatever commands go next
        );        
      }
    }
    clean: {
      ...
    }
  }  
};
```

*Pro-tip!*  
Running the typescript compiler, but only if the sources did not change - this reduces build times tremendously!
```js
module.exports = {
  commands: {
    compile: {
      run: async(exec, args, utils) => {
        const delta = await utils.getFileChanges('typescript', [
          './src/**/*.ts',
          './src/**/*.tsx'
        ]);
        
        if (delta.hasChanges) {
          await exec(
            // here you would remove all target files generated by this step
            // then compile new target files
            'tsc -p .'
            // additionally you could even only run the compiler over delta.added + delta.modified files
          );
        }
      }
    }
  }  
};
```

## Documentation

The basic structure of a ```makfyfile.js``` is as follows:
```js
module.exports = {
  commands: {
    [commandName]: {
      run: async(exec, args, utils) => Promise<void>,
      desc?: string,
      args?: {
        [argName]: ArgDefinition
      },
      internal?: boolean
    }   
  },
  options?: Options
};
```

In more detail:

### ```commands: { [commandName]: Command }```
```commands``` is an object with alphanumeric keys, which are the command names.
 
#### ```Command: { run, desc?, args? }```
  * **```run: async(exec, args, utils) => Promise<void>```**
    > An async function that takes three arguments, ```exec```, ```args``` and ```utils```.
    >    
    > * **```exec: async(...commands: ExecCommand[]) => Promise<void>```**
    >   > A function that allows you to run ```ExecCommand```(s) sequentially, which can be:
    >   >
    >   > * **shell string (e.g. ```'npm install'```) - ```string```**
    >   >   >  It will run the given command in the shell.
    >   >   >
    >   >   >  If the string starts with ```%``` then stdout will be silenced, 
    >   >   >  if it starts with ```%%``` then both stdout and the log of the command itself will be silenced.
    >   >   >
    >   >   >  Note that stderr is never silenced, so errors/warnings will always be shown.
    >   >
    >   > * **help string (e.g. ```'? installing packages'```) - ```string```**
    >   >   > It will print that help to the console, useful to keep track of what your build is doing.
    >   >
    >   > * **command invocation object - ```{ _: 'commandName', args?: object }```**
    >   >   > It will run another command inside the current command, optionally passing it the given arguments if desired.         
    >   >   >
    >   >   > A simpler way to invoke sub-commands is using the string ```'@commandName ...args'``` as if it was invoked from the shell.
    >   >   >
    >   >   > Note that the arguments are validated automatically for you as they would if they were coming from the command line directly.
    >   >
    >   > * **exec-command array (e.g. ```[ 'npm install', '@clean' ]```) - ```ExecCommand[]```**
    >   >   >   It will run whatever is inside but in parallel instead of sequentially. If an array is used inside another array then it will go back to run sequentially.
    >   >   >  
    >   >   > This should allow you to create complex sequential/parallel executions such as:
    >   >   >    ```js
    >   >   >    await exec(
    >   >   >      a,
    >   >   >      [ b, c ], // once a is done then runs in parallel b+c
    >   >   >      // once a, b+c are done then runs (e,f) in parallel with (g,h)
    >   >   >      [
    >   >   >        [ e, f ],   
    >   >   >        [ g, h ]
    >   >   >      ],
    >   >   >      i // once a, b+c, (e,f)+(g+h) are done then runs i
    >   >   >    );
    >   >   >    ```
    >   >   >      
    >   >   >   Of course even more complex scenarios are supported since ```exec(...)``` basically returns an awaitable Promise.
    >
    > * **```args: object```**
    >   > An object where each property is the argument value as coming from the command line or exec sub-command invocation.
    >
    > * **```utils: object```**
    >   > An object with nifty utility methods. See the end of the docs for more info.

   * **```desc?: string```**
     > An optional property that defines what the command does so it is shown when using ```makfy --list```.
 
   * **```args?: { [argName]: ArgDefinition }```**
     > An optional object of argument definitions that can be passed to that command using ```makfy commandName ...args``` and that will be automatically validated.
     > 
     > An ```ArgDefinition``` can be:
     > * **Flag option - ```{ type: 'flag' | 'f' }```**
     >
     >   > An optional flag, false by default unless you use ```--argName```
     >
     > * **String option - ```{ type: 'string' | 's', byDefault?: string }```**
     >
     >   > A string option, required if no ```byDefault``` is given (```--argName=string```, use quotes if it has to have spaces)
     >
     > * **Enum option - ```{ type: 'enum' | 'e', values: string[], byDefault?: string }```**
     >
     >   > An enum option where only ```values``` are valid, required if no ```byDefault``` is given (```--argName=string```)
     >
     > All of them accept a ```desc?: string``` property in case you want to add a given help string to them.

   * **```internal?: boolean```**
     > An optional boolean that indicates that it is an internal command, that is, it should not be shown when listing and cannot be invoked directly from the command line (default: ```false```).

 ### ```options: {profile?, showTime?}```
 ```options``` is an optional object that can be exported to set the default of some options:
 * ```profile: boolean```
 
   > When set it will log how much each shell command takes (default: ```false```)
 
 * ```showTime: boolean```
  
   > When set it will show the current time near each log line (default: ```false```)

### Utility methods (provided by ```utils```)
* ```escape: (...parts: string[]) => string```
  > Escapes all parts of a given shell command.
  > For example, ```escape('hello', 'to this world')``` will return ```hello "to this world"``` under a cmd shell and ```hello 'to this world'``` under other shells .

* ```fixPath: (path: string, style: 'autodetect' | 'windows' | 'posix') => string```
  > Fixes a path so it is valid under a given OS, by swapping ```/``` and ```\ ``` if needed, plus converting ```c:\...``` to ```/c/...``` in mingw in windows.
  > The optional style argument forces the result to be valid in windows or posix (default: ```'autodetect'```).

* ```setEnvVar: (name: string, value: string | undefined) => string```
  > Returns a command string that can be used inside ```exec``` to set/clear an environment variable.
  > For example, ```setEnvVar('NODE_ENV', 'development)``` will return ```'set NODE_ENV=development'``` under a cmd shell and ```'export NODE_ENV=development'``` under other shells.

* ```getFileChangesAsync: async(contextName: string, gobPatterns: string[] | string, options: { log = true }) => Promise<GetFileChangesResult>```
  > Returns an object which includes the changes to the given files (given a certain context) since the last successful run.
  > If there was no previous successful run (or the cache was cleared) then it is considered a clean run.
  > ```js
  > {
  >   hasChanges: boolean,  // true if there are any changes or it is a clean run
  >   cleanRun: boolean,    // true if it is a clean run (no previous version to compare against was available)
  >   added: string[],      // files created since the last successful run (this is the only array with contents if it is a clean run) 
  >   removed: string[],    // files deleted since the last successful run
  >   modified: string[],   // files modified since the last successful run
  >   unmodified: string[]  // files not modified since the last successful run
  > }
  > ```
  > Useful for example if you don't want to rerun the babel if none of the sources changed.
  >
  > The single option avaible is ```log``` to log the cache verification result (default: ```true```).
  >  
  > **Notes:**
  > - If you generate two different targets based on the same source files (for example a production vs a debug bundle) make sure to use different context names for each one.
  > - This function will create files inside a ```.makfy-cache``` folder at the end of every successful run.
  > - If you change the ```makfyfile.js``` contents then a clean run will be assumed. This is done so you don't have to manually clean the cache folder every time you make changes to it.     

* ```cleanCache: () => void```
  > Cleans the ```.makfy-cache``` folder. Use it if you want to make sure all next calls to ```getFileChangesAsync``` work as if it was a clean run.


## FAQ

##### Recommended CLI packages for cross-platform commands
* _Set/unset an environment variable:_ Just invoke ```utils.setEnvVar``` inside an ```exec``` call. Alternatively use [cross-env](https://www.npmjs.com/package/cross-env).
* _Delete files/directories:_ [rimraf](https://www.npmjs.com/package/rimraf)
* _Copy files/directories:_ [ncp](https://www.npmjs.com/package/ncp)
* _Create a directory:_ [mkdirp](https://www.npmjs.com/package/mkdirp)

##### Keeping the context between ```exec``` executions
Executions inside a very same ```exec``` call keep track of changes to the current working directory and environment variables.

If you wish to keep the context between different ```exec``` executions you can do so like this:
```js
const a = await exec(...);
await a.keepContext(...);
```

**Note:** In unix style shells you need to export the variable for it to be tracked (e.g. ```export NODE_ENV=production```). Consider using ```utils.setEnvVar```, which does this for you.
