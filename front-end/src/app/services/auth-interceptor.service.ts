import {Inject, Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {from, Observable, lastValueFrom} from "rxjs";
import {OKTA_AUTH} from "@okta/okta-angular";
import {OktaAuth} from "@okta/okta-auth-js";
import {environment} from "../../environments/environment";


@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor{

  constructor(@Inject(OKTA_AUTH) private oktaAuth: OktaAuth) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      const endPoint = environment.apiUrl + '/orders'
      const securedEndpoints = [endPoint];

      if(securedEndpoints.some(url => request.urlWithParams.includes(url))) {
          const accessToken = this.oktaAuth.getAccessToken();
          console.log('token', accessToken);
          let authReq = request.clone({
              headers:  request.headers.set(
                  "Authorization", 'Bearer ' + accessToken
              )
          });
          return next.handle(authReq);
      }
      return next.handle(request);
  }
}
