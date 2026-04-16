const core = require('@actions/core');

async function run() {
    try{
        const PRtitle = core.getInput('pr-title');
        if(PRtitle.startsWith('feat')){
            core.info("PR is a feature");
        }
        else{
            core.setFailed("PR is not a feature");        }
    }catch{
        core.setFailed(e.message);
    }
}

run();