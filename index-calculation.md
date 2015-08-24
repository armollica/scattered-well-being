## *Scatter Well-Being* data sources and index calculations

### Data sources

The raw data used to create the well-being indexes can be found here:
[http://www3.inegi.org.mx/sistemas/descarga/](http://www3.inegi.org.mx/sistemas/descarga/). They are under the **Indicadores > Por entidad federativa** directory.

Most of the data come from the census of 2010. However, when possible more up-to-date data was used.

### Index creation

Indexes must have consist boundaries.
In order to ensure a measure is bound I frequently normalized variables to be between 0 and 1:

norm(x) = (x - min(x))/(max(x) - min(x))

##### Housing:

crowdedness = norm(average occupancy in dwelling)

index_housing = 1 - ( 0.5 \* crowdedness + 0.25 \* % of dwellings without toilet + 0.25 \* % of dwellings without refridgerator)


##### Jobs:

pseudo_unemployment_rate = 1 - norm( total employed pop. / pop 6-60 years old)

labor_disputes_per_capita = labor disputes / population

index_jobs = norm(1 - ( 0.9 \* pseudo_unemployment_rate + 0.1 \* labor_disputes_per_capita)

##### Education:
index_education = norm(
  0.1 \* literacy rate +
  0.3 \* norm(avg. years schooling) +
  0.1 \* % pop 5+ years old with some schooling +
  0.2 \* secondary school achievement index *
  0.2 \* high school achievement index
  )

##### Income:

index_income = norm(income / employee)

*note: I censored this variable at the top and re-normalize because there were a few small municipalities with very high incomes that made the index bunched new zero for most municipalities. The ranking of municipalities is unchanged aside from some upper limit municipalities are now all tied at 1*


##### Health:

index_health = norm(
  0.5 \* norm(infant deaths / births) +
  0.5 \* norm(health consultations per doctor)
  )

*note: similar to income, I had to censor and then re-normalize this index.
The ranking for most municipalities is unchanged*

##### Safety:

index_safety = 1 - norm(
    0.5 \* norm(murders / population) +
    0.5 \* norm(sexual offenses / population)
  )

*note: similar to income, I had to censor and then re-normalize this index
The ranking for most municipalities is unchanged*
