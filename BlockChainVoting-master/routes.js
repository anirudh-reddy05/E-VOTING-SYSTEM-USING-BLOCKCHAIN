const routes = require('next-routes')();

routes
    .add('/','/homepage')
    .add('/homepage','/homepage')
    .add('/company_login','/company_login')
    .add('/voter_login','/voter_login')
    .add('/election/:address/company_dashboard','/election/company_dashboard')
    .add('/election/:address/admin_panel','/election/admin_panel')
    .add('/election/:address/voting_list','/election/voting_list')
    .add('/election/:address/addcand','/election/addcand')
    .add('/election/:address/vote','/election/vote')
    .add('/election/:address/candidate_list','/election/candidate_list')
    .add('/election/select_election','/election/select_election');
module.exports = routes;