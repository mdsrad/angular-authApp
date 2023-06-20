
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environments } from 'src/app/environments/environments';
import { CheckTokenResponse, LoginResponse, User } from '../interfaces';
import { AuthStatus } from '../interfaces/auth-status.enum';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly baseUrl: string = environments.baseUrl;
  private http = inject( HttpClient );

  private _currentUser = signal<User|null>(null);
  private _authStatus = signal<AuthStatus>( AuthStatus.checking );

  //! Al mundo exterior
  public currentUser = computed( () => this._currentUser() );
  public authStatus = computed( () => this._authStatus() );

  constructor() { }

  login( email: string, password: string ): Observable<boolean>{

    const url = `${ this.baseUrl }/auth/login`;
    const body = { email, password };

    return this.http.post<LoginResponse>( url, body )
    .pipe(
      tap(({ user, token }) => {
        this._currentUser.set( user );
        this._authStatus.set( AuthStatus.authenticated );
        localStorage.setItem('token', token);
        console.log({ user, token })
      }),
      map( () => true),
      //TODO errores
      catchError( err => {
        console.log(err)
        return throwError( () => 'Algo salió mal');
      })
    );
  }

  checkAuthStarus(): Observable<boolean>{
    const url   = `${ this.baseUrl }/auth/ckeck-token`;
    const token = localStorage.getItem('token')

    if ( !token ) return of( false );

    const headers = new HttpHeaders()
    .set('Authorization', `Bearer ${ token }`);

    return this.http.get<CheckTokenResponse>( url, { headers })
      .pipe(
        map( ({ token, user }) => {
          this._currentUser.set( user );
          this._authStatus.set( AuthStatus.authenticated );
          localStorage.setItem('token', token);
          return true;
        }),

        //error
        catchError( () => {
          this._authStatus.set( AuthStatus.notAuthenticated )
          return of(false)
        })
      );
  }
}
